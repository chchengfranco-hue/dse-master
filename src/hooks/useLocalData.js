import { useState, useCallback } from 'react';

export function useLocalData(key, defaultValue) {
  const [data, setData] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : defaultValue;
    } catch { return defaultValue; }
  });

  const update = useCallback((newData) => {
    setData(newData);
    localStorage.setItem(key, JSON.stringify(newData));
  }, [key]);

  return [data, update];
}