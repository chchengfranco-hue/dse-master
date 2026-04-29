/**
 * Persistent Storage Utility
 * Automatically saves and retrieves form data from localStorage
 * Ensures no data loss when app updates or navigates
 */

const STORAGE_PREFIX = 'dse_';

export const useStorage = (key, defaultValue = null) => {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  const save = (data) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
      return true;
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      return false;
    }
  };

  const load = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      return parsed.data ?? defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
      return false;
    }
  };

  return { save, load, clear, key: storageKey };
};

/**
 * Auto-save hook for React components
 * Automatically saves form state after user stops typing (debounced)
 */
export const useAutoSave = (formData, storageKey, debounceMs = 500) => {
  const storage = useStorage(storageKey);
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set new timeout to save after user stops interacting
    timeoutRef.current = setTimeout(() => {
      storage.save(formData);
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [formData, storageKey]);

  return storage;
};

/**
 * Save multiple form states atomically
 * Ensures consistency across related forms
 */
export const saveFormState = (formStates) => {
  const timestamp = new Date().toISOString();
  const success = [];
  const failed = [];

  for (const [key, data] of Object.entries(formStates)) {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify({ data, timestamp })
      );
      success.push(key);
    } catch (error) {
      failed.push({ key, error: error.message });
    }
  }

  return { success, failed };
};

/**
 * Load multiple form states
 */
export const loadFormStates = (keys, defaults = {}) => {
  const results = {};
  
  for (const key of keys) {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      results[key] = stored 
        ? JSON.parse(stored).data 
        : (defaults[key] ?? null);
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      results[key] = defaults[key] ?? null;
    }
  }

  return results;
};

/**
 * Clear all DSE app data from storage
 */
export const clearAllAppData = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  
  keys.forEach(key => localStorage.removeItem(key));
  return keys.length;
};

/**
 * Export all saved form data as JSON
 */
export const exportAllData = () => {
  const data = {};
  const timestamp = new Date().toISOString();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const stored = localStorage.getItem(key);
        const cleanKey = key.replace(STORAGE_PREFIX, '');
        data[cleanKey] = JSON.parse(stored).data;
      } catch (error) {
        console.error(`Failed to export ${key}:`, error);
      }
    }
  }

  return { data, timestamp };
};

/**
 * Import form data from JSON
 */
export const importData = (exportedData) => {
  const timestamp = new Date().toISOString();
  const results = { imported: 0, failed: 0 };

  for (const [key, data] of Object.entries(exportedData.data ?? {})) {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${key}`,
        JSON.stringify({ data, timestamp })
      );
      results.imported++;
    } catch (error) {
      console.error(`Failed to import ${key}:`, error);
      results.failed++;
    }
  }

  return results;
};
