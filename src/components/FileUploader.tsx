import { useState, useRef } from 'react';
import { parseLogContent, parseLogLine, LogEntry } from '../lib/parser';
import JSZip from 'jszip';
import { savePanelCollapsed, loadPanelCollapsed } from '../lib/statistics';

export interface RawFile {
  id: string;
  name: string;
  content: string;
  children?: Array<{ name: string; content: string }>;
}

interface FileUploaderProps {
  onUpload: (entries: LogEntry[]) => void;
  onRawFiles: (files: RawFile[]) => void;
}

async function processZipFile(file: File): Promise<{ entries: LogEntry[]; rawChildren: Array<{ name: string; content: string }> }> {
  const zip = new JSZip();
  const zipData = await file.arrayBuffer();
  const extractedZip = await zip.loadAsync(zipData);

  let allEntries: LogEntry[] = [];
  const rawChildren: Array<{ name: string; content: string }> = [];
  const timestamp = Date.now();

  for (const [filename, fileObj] of Object.entries(extractedZip.files)) {
    if (fileObj.dir || filename === 'log_state.json' || !filename.endsWith('.json')) {
      continue;
    }

    try {
      const fileContent = await fileObj.async('text');
      rawChildren.push({ name: filename, content: fileContent });

      const jsonData = JSON.parse(fileContent);

      let entries: unknown[];
      if (Array.isArray(jsonData)) {
        entries = jsonData;
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        const nested = Object.values(jsonData).find(Array.isArray);
        if (!nested) {
          console.warn(`Warning: ${filename} contains no array to parse`);
          continue;
        }
        entries = nested as unknown[];
      } else {
        console.warn(`Warning: ${filename} is not a JSON array or object`);
        continue;
      }

      entries.forEach((entry, idx) => {
        const id = `${timestamp}-${allEntries.length}-${idx}`;
        const jsonStr = JSON.stringify(entry);
        const parsed = parseLogLine(jsonStr, id, filename);
        if (parsed) allEntries.push(parsed);
      });
    } catch (err) {
      console.error(`Error processing ${filename}:`, err);
    }
  }

  return { entries: allEntries, rawChildren };
}

export default function FileUploader({ onUpload, onRawFiles }: FileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(() => loadPanelCollapsed('uploader'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let allEntries: LogEntry[] = [];
      const rawFilesToAdd: RawFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${Date.now()}-${i}`;

        if (file.name.endsWith('.zip')) {
          const { entries, rawChildren } = await processZipFile(file);
          allEntries = allEntries.concat(entries);
          rawFilesToAdd.push({ id: fileId, name: file.name, content: '', children: rawChildren });
        } else {
          const content = await file.text();
          const entries = parseLogContent(content, file.name);
          allEntries = allEntries.concat(entries);
          rawFilesToAdd.push({ id: fileId, name: file.name, content });
        }
      }

      if (rawFilesToAdd.length > 0) {
        onRawFiles(rawFilesToAdd);
      }

      if (allEntries.length === 0) {
        setError('No valid log entries found in selected file(s)');
        return;
      }

      onUpload(allEntries);
    } catch (err) {
      setError(`Failed to read file(s): ${(err as Error).message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        for (let i = 0; i < files.length; i++) {
          dataTransfer.items.add(files[i]);
        }
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="file-uploader">
      <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { savePanelCollapsed('uploader', !c); return !c; })}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        📁 Upload Log File(s)
        <button
          className="uploader-browse-btn"
          onClick={e => { e.stopPropagation(); handleClick(); }}
          disabled={loading}
        >Browse</button>
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={loading}
        className="file-input"
        accept=".log,.txt,.zip,.json"
        multiple
      />

      {!collapsed && (
        <>
          <div
            className="upload-area"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            {loading ? (
              <p className="upload-text">Loading...</p>
            ) : (
              <>
                <p className="upload-text">📤 Drag & drop log file(s) here</p>
                <p className="upload-hint">or click to browse</p>
              </>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </div>
  );
}
