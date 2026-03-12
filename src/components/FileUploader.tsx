import { useState, useRef } from 'react';
import { parseLogContent, LogEntry } from '../lib/parser';
import JSZip from 'jszip';

interface FileUploaderProps {
  onUpload: (entries: LogEntry[]) => void;
}

async function processZipFile(file: File): Promise<LogEntry[]> {
  const zip = new JSZip();
  const zipData = await file.arrayBuffer();
  const extractedZip = await zip.loadAsync(zipData);

  let allEntries: LogEntry[] = [];
  const timestamp = Date.now();

  for (const [filename, fileObj] of Object.entries(extractedZip.files)) {
    // Skip directories, the log_state.json file, and non-JSON files
    if (fileObj.dir || filename === 'log_state.json' || !filename.endsWith('.json')) {
      continue;
    }

    try {
      const fileContent = await fileObj.async('text');
      const jsonData = JSON.parse(fileContent);

      // Expect an array of log entries from each JSON file
      if (!Array.isArray(jsonData)) {
        console.warn(`Warning: ${filename} does not contain a JSON array`);
        continue;
      }

      // Convert JSON entries to LogEntry format
      jsonData.forEach((entry, idx) => {
        const id = `${timestamp}-${allEntries.length}-${idx}`;
        const logEntry: LogEntry = {
          id,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          level: (entry.level || entry.severity || 'info').toLowerCase(),
          source: entry.source || entry.component || filename,
          filename: filename,
          message: entry.message || entry.msg || JSON.stringify(entry),
          raw: JSON.stringify(entry),
          metadata: entry,
        };
        allEntries.push(logEntry);
      });
    } catch (err) {
      console.error(`Error processing ${filename}:`, err);
    }
  }

  return allEntries;
}

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let allEntries: LogEntry[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let entries: LogEntry[] = [];

        if (file.name.endsWith('.zip')) {
          // Handle ZIP files
          entries = await processZipFile(file);
        } else {
          // Handle regular text log files
          const content = await file.text();
          entries = parseLogContent(content, file.name);
        }

        allEntries = allEntries.concat(entries);
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
      <h3>📁 Upload Log File(s)</h3>

      <div
        className="upload-area"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={loading}
          className="file-input"
          accept=".log,.txt,.zip"
          multiple
        />

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
    </div>
  );
}
