import { useEffect, useRef, useCallback } from 'react';
import { useStorage } from '@/lib/storage';

/**
 * Hook to automatically save form data to localStorage
 * Prevents data loss when app updates, navigates, or crashes
 * 
 * @param {Object} formData - The form data to persist
 * @param {string} storageKey - Unique key for storage
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 500)
 * @param {boolean} options.immediate - Save immediately without debounce (default: false)
 * @param {boolean} options.enabled - Enable/disable auto-save (default: true)
 * @returns {Object} Storage utilities and status
 */
export function useFormAutoSave(formData, storageKey, options = {}) {
  const {
    debounceMs = 500,
    immediate = false,
    enabled = true,
  } = options;

  const storage = useStorage(storageKey);
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isSavingRef = useRef(false);

  // Save function
  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      const success = storage.save(formData);
      
      if (success) {
        lastSavedRef.current = new Date();
      }
      
      return success;
    } finally {
      isSavingRef.current = false;
    }
  }, [formData, storage, enabled]);

  // Load initial data
  const load = useCallback(() => {
    return storage.load();
  }, [storage]);

  // Handle auto-save with debounce
  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save immediately or with debounce
    if (immediate) {
      save();
    } else {
      timeoutRef.current = setTimeout(save, debounceMs);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, save, enabled, immediate, debounceMs]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled) {
        save();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [save, enabled]);

  return {
    save,
    load,
    clear: storage.clear,
    lastSaved: lastSavedRef.current,
    storageKey: storage.key,
    isSaving: isSavingRef.current,
  };
}

/**
 * Hook to manage multiple form sections with auto-save
 * Useful for complex forms with multiple independent sections
 * 
 * @param {string} baseKey - Base key for storage
 * @param {Object} sections - Object with section name as key and initial value
 * @param {Object} options - Configuration options
 * @returns {Object} Form state, updaters, and utilities
 */
export function useMultiSectionForm(baseKey, sections, options = {}) {
  const [formState, setFormState] = (React.useState || window.React.useState)(sections);
  
  const autoSave = useFormAutoSave(formState, baseKey, options);

  const updateSection = useCallback((sectionName, data) => {
    setFormState(prev => ({
      ...prev,
      [sectionName]: typeof data === 'function' ? data(prev[sectionName]) : data,
    }));
  }, []);

  const loadSection = useCallback((sectionName) => {
    return formState[sectionName];
  }, [formState]);

  const clearSection = useCallback((sectionName) => {
    setFormState(prev => ({
      ...prev,
      [sectionName]: sections[sectionName], // Reset to initial value
    }));
  }, [sections]);

  return {
    formState,
    updateSection,
    loadSection,
    clearSection,
    clearAll: () => {
      setFormState(sections);
      autoSave.clear();
    },
    ...autoSave,
  };
}

export default useFormAutoSave;
