import { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, initializeUsers } from '@/lib/auth';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeUsers().then(() => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const users = getUsers();
        const user = users.find(u => u.username === stored);
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user.username);
          setIsEditor(user.isEditor);
        }
      }
      setReady(true);
    });
  }, []);

  const login = (username, password) => {
    const users = getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      setIsAuthenticated(true);
      setIsEditor(user.isEditor);
      setCurrentUser(user.username);
      localStorage.setItem('currentUser', user.username);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsEditor(false);
    setCurrentUser('');
    localStorage.removeItem('currentUser');
  };

  return (
    <UserContext.Provider value={{ isAuthenticated, isEditor, currentUser, login, logout, ready }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);