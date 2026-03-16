/**
 * Returns a timestamp string suitable for use in download filenames.
 * Edit the format here to change it everywhere a file is downloaded.
 */
export function downloadTimestamp(): string {
  // Currently: YYYYMMDD_HHMMSS
  const d = new Date();
  const date = d.toLocaleDateString('en-CA').replace(/-/g, '');
  const time = d.toLocaleTimeString('en-GB').replace(/:/g, '');
  const ts = `${date}_${time}`;
  return ts;

}
