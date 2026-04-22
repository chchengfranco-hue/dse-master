import { useState, useCallback } from 'react';

export function useLocalData(key, defaultValue) {
  const [data, setData] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) {
        const parsed = JSON.parse(s);
        // Always prefer stored data; only fall back to default if stored data is empty/null
        if (parsed !== null && parsed !== undefined && !(Array.isArray(parsed) && parsed.length === 0)) {
          return parsed;
        }
      }
      // No stored data — save defaults so future updates don't overwrite
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const update = useCallback((newData) => {
    setData(newData);
    try {
      localStorage.setItem(key, JSON.stringify(newData));
    } catch (e) {
      console.warn('useLocalData: failed to persist', key, e);
    }
  }, [key]);

  return [data, update];
}