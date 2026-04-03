import { useEffect } from 'react';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  sep?: 'and' | 'or';
  description: string;
}

const SHORTCUTS: { group: string; items: ShortcutItem[] }[] = [
  {
    group: 'Global',
    items: [
      { keys: ['/'], description: 'Focus filter search bar' },
      { keys: ['Ctrl', 's'], sep: 'and', description: 'Open settings' },
      { keys: ['Ctrl', '?'], sep: 'and', description: 'Show keyboard shortcuts' },
    ],
  },
  {
    group: 'Log Entry Table',
    items: [
      { keys: ['↑', 'k'], sep: 'or', description: 'Previous log entry' },
      { keys: ['↓', 'j'], sep: 'or', description: 'Next log entry' },
    ],
  },
  {
    group: 'Entry Detail Panel',
    items: [
      { keys: ['←'], description: 'Previous entry' },
      { keys: ['→'], description: 'Next entry' },
      { keys: ['c'], description: 'Scroll table to active entry' },
    ],
  },
  {
    group: 'File Editor',
    items: [
      { keys: ['Ctrl', 'Tab'], sep: 'and', description: 'Next file tab' },
      { keys: ['Ctrl', 'Shift', 'Tab'], sep: 'and', description: 'Previous file tab' },
      { keys: ['Ctrl', 'g'], sep: 'and', description: 'Go to line' },
      { keys: ['Ctrl', 'f'], sep: 'and', description: 'Focus search bar' },
      { keys: ['Ctrl', 'w'], sep: 'and', description: 'Close active tab' },
      { keys: ['Enter'], description: 'Find next match' },
      { keys: ['Shift', 'Enter'], sep: 'and', description: 'Find previous match' },
    ],
  },
];

export default function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="features-panel-overlay" onClick={onClose}>
      <div className="features-panel keyboard-shortcuts-panel" onClick={e => e.stopPropagation()}>
        <div className="features-panel-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="features-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="keyboard-shortcuts-body">
          {SHORTCUTS.map(group => (
            <div key={group.group} className="keyboard-shortcuts-group">
              <div className="keyboard-shortcuts-group-label">{group.group}</div>
              {group.items.map((item, i) => {
                const sep = item.sep ?? (item.keys.length > 1 ? 'and' : undefined);
                return (
                  <div key={i} className="keyboard-shortcut-row">
                    <span className="keyboard-shortcut-keys">
                      {item.keys.map((k, ki) => (
                        <span key={ki}>
                          <kbd className="kbd">{k}</kbd>
                          {ki < item.keys.length - 1 && (
                            <span className="kbd-sep">{sep === 'or' ? 'or' : '+'}</span>
                          )}
                        </span>
                      ))}
                    </span>
                    <span className="keyboard-shortcut-desc">{item.description}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
