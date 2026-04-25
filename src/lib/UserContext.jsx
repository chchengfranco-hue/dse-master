import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getUsers, initializeUsers } from '@/lib/auth';

const UserContext = createContext(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function UserProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [ready, setReady] = useState(false);
  const logoutTimerRef = useRef(null);

  const clearSession = () => {
    setIsAuthenticated(false);
    setIsEditor(false);
    setCurrentUser('');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };

  const scheduleAutoLogout = (loginTime) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    const elapsed = Date.now() - loginTime;
    const remaining = SESSION_TIMEOUT_MS - elapsed;
    if (remaining <= 0) {
      clearSession();
    } else {
      logoutTimerRef.current = setTimeout(() => { clearSession(); }, remaining);
    }
  };

  useEffect(() => {
    initializeUsers().then(() => {
      const stored = localStorage.getItem('currentUser');
      const loginTime = parseInt(localStorage.getItem('loginTime') || '0', 10);
      if (stored && loginTime) {
        const elapsed = Date.now() - loginTime;
        if (elapsed >= SESSION_TIMEOUT_MS) {
          clearSession();
        } else {
          const users = getUsers();
          const user = users.find(u => u.username === stored);
          if (user) {
            setIsAuthenticated(true);
            setCurrentUser(user.username);
            setIsEditor(user.isEditor);
            scheduleAutoLogout(loginTime);
          }
        }
      }
      setReady(true);
    });
    return () => { if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current); };
  }, []);

  const login = (username, password) => {
    const users = getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      const now = Date.now();
      setIsAuthenticated(true);
      setIsEditor(user.isEditor);
      setCurrentUser(user.username);
      localStorage.setItem('currentUser', user.username);
      localStorage.setItem('loginTime', String(now));
      scheduleAutoLogout(now);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <UserContext.Provider value={{ isAuthenticated, isEditor, currentUser, login, logout, ready }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);