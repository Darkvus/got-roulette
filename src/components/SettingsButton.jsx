import { useState } from 'react';
import { useSettings } from '../settingsContext';

export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme, soundEnabled, toggleSound } = useSettings();

  return (
    <div className="settings-wrap">
      <button
        className="settings-btn"
        aria-label="Ajustes"
        onClick={() => setOpen((o) => !o)}
      >
        ⚙️
      </button>
      {open && (
        <div className="settings-panel">
          <button className="settings-row" onClick={toggleSound}>
            <span>{soundEnabled ? '🔊' : '🔇'} Sonido</span>
            <span className={`settings-toggle ${soundEnabled ? 'on' : ''}`} />
          </button>
          <button className="settings-row" onClick={toggleTheme}>
            <span>{theme === 'dark' ? '🌙' : '☀️'} Tema {theme === 'dark' ? 'oscuro' : 'claro'}</span>
            <span className={`settings-toggle ${theme === 'light' ? 'on' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
}
