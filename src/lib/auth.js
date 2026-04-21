export const getUsers = () => {
  const stored = localStorage.getItem("appUsers");
  return stored ? JSON.parse(stored) : [];
};

export const initializeUsers = () => {
  const stored = localStorage.getItem("appUsers");
  if (!stored) {
    const defaultUsers = [{ username: "teacher", password: "teacher2026", isEditor: true }];
    localStorage.setItem("appUsers", JSON.stringify(defaultUsers));
  }
};

export const saveUsers = (users) => {
  localStorage.setItem("appUsers", JSON.stringify(users));
};