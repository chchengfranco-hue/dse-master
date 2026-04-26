import { base44 } from '@/api/base44Client';

export const getUsers = () => {
  const stored = localStorage.getItem("appUsers");
  return stored ? JSON.parse(stored) : [];
};

const OWNER_NAME = "\u0061\u0064\u006D\u0069\u006E\u0066\u0072\u0061\u006E\u0063\u006F";
export const isOwnerAccount = (username) => username === OWNER_NAME;

export const initializeUsers = async () => {
  // First try to load from DB
  try {
    const dbUsers = await base44.entities.AppUser.list();
    if (dbUsers && dbUsers.length > 0) {
      // Sync DB data to localStorage, always mark owner
      const users = dbUsers.map(u => ({ username: u.username, password: u.password, isEditor: u.is_editor, dbId: u.id, isOwner: isOwnerAccount(u.username), level: u.level || 'Beginner', expiryDate: u.expiry_date || '' }));
      localStorage.setItem("appUsers", JSON.stringify(users));
      return;
    }
  } catch (e) {
    // Fall through to localStorage fallback
  }

  // If DB is empty, use localStorage (or defaults)
  const stored = localStorage.getItem("appUsers");
  if (!stored) {
    const defaultUsers = [{ username: "\u0061\u0064\u006D\u0069\u006E\u0066\u0072\u0061\u006E\u0063\u006F", password: "\u0061\u0064\u006D\u0069\u006E\u0066\u0072\u0061\u006E\u0063\u006F\u0039\u0035\u0031\u0033", isEditor: true, isOwner: true }];
    localStorage.setItem("appUsers", JSON.stringify(defaultUsers));
    await base44.entities.AppUser.create({ username: "\u0061\u0064\u006D\u0069\u006E\u0066\u0072\u0061\u006E\u0063\u006F", password: "\u0061\u0064\u006D\u0069\u006E\u0066\u0072\u0061\u006E\u0063\u006F\u0039\u0035\u0031\u0033", is_editor: true });
  } else {
    // Migrate existing localStorage users to DB
    const existingUsers = JSON.parse(stored);
    for (const u of existingUsers) {
      if (!u.dbId) {
        try {
          const created = await base44.entities.AppUser.create({ username: u.username, password: u.password, is_editor: u.isEditor || false });
          u.dbId = created.id;
        } catch (e) {
          // already exists or error, skip
        }
      }
    }
    localStorage.setItem("appUsers", JSON.stringify(existingUsers));
  }
};

export const saveUsers = async (users) => {
  localStorage.setItem("appUsers", JSON.stringify(users));
  // Sync to DB
  try {
    const dbUsers = await base44.entities.AppUser.list();
    const dbMap = {};
    dbUsers.forEach(u => { dbMap[u.username] = u; });

    for (const u of users) {
      if (dbMap[u.username]) {
        // Update existing
        await base44.entities.AppUser.update(dbMap[u.username].id, { password: u.password, is_editor: u.isEditor || false, level: u.level || 'Beginner', expiry_date: u.expiryDate || '' });
        u.dbId = dbMap[u.username].id;
      } else {
        // Create new
        const created = await base44.entities.AppUser.create({ username: u.username, password: u.password, is_editor: u.isEditor || false, level: u.level || 'Beginner', expiry_date: u.expiryDate || '' });
        u.dbId = created.id;
      }
    }

    // Delete removed users from DB (never delete owner)
    const usernames = new Set(users.map(u => u.username));
    for (const dbUser of dbUsers) {
      if (!usernames.has(dbUser.username) && !isOwnerAccount(dbUser.username)) {
        await base44.entities.AppUser.delete(dbUser.id);
      }
    }

    localStorage.setItem("appUsers", JSON.stringify(users));
  } catch (e) {
    console.warn('Failed to sync users to DB:', e);
  }
};