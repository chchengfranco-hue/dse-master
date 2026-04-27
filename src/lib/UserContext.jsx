import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getUsers, initializeUsers } from '@/lib/auth';

const UserContext = createContext(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

export function UserProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [allowedModules, setAllowedModules] = useState(null); // null = all allowed
  const [ready, setReady] = useState(false);
  const logoutTimerRef = useRef(null);
  const isAuthRef = useRef(false);

  const clearSession = useCallback(() => {
    isAuthRef.current = false;
    setIsAuthenticated(false);
    setIsEditor(false);
    setCurrentUser('');
    setAllowedModules(null);
    localStorage.removeItem('currentUser');
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthRef.current) return;
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => { clearSession(); }, SESSION_TIMEOUT_MS);
  }, [clearSession]);

  // Attach/detach activity listeners
  useEffect(() => {
    const handler = () => resetInactivityTimer();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handler));
  }, [resetInactivityTimer]);

  useEffect(() => {
    initializeUsers().then(() => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const users = getUsers();
        const user = users.find(u => u.username === stored);
        if (user) {
          isAuthRef.current = true;
          setIsAuthenticated(true);
          setCurrentUser(user.username);
          setIsEditor(user.isEditor);
          setAllowedModules(user.allowedModules || null);
          resetInactivityTimer();
        }
      }
      setReady(true);
    });
    return () => { if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current); };
  }, []);

  // Periodically check if current user's account has expired
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAuthRef.current) return;
      const stored = localStorage.getItem('currentUser');
      if (!stored) return;
      const users = getUsers();
      const user = users.find(u => u.username === stored);
      if (!user) return;
      if (user.expiryDate && new Date(user.expiryDate) < new Date(new Date().toDateString())) {
        clearSession();
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [clearSession]);

  const login = (username, password) => {
    const users = getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!user) return false;
    // Block login if account is expired (paused)
    if (user.expiryDate && new Date(user.expiryDate) < new Date(new Date().toDateString())) {
      return 'expired';
    }
    isAuthRef.current = true;
    setIsAuthenticated(true);
    setIsEditor(user.isEditor);
    setCurrentUser(user.username);
    setAllowedModules(user.allowedModules || null);
    localStorage.setItem('currentUser', user.username);
    resetInactivityTimer();
    return true;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <UserContext.Provider value={{ isAuthenticated, isEditor, currentUser, allowedModules, login, logout, ready }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);