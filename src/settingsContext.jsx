import { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('got-theme') || 'dark');
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('got-sound') !== 'off'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('got-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('got-sound', soundEnabled ? 'on' : 'off');
  }, [soundEnabled]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleSound = () => setSoundEnabled((s) => !s);

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, soundEnabled, toggleSound }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
