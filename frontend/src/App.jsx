import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./layouts/AdminLayout";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("pos_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("pos_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("pos_user");
    }
  }, [user]);

  return user ? (
    <AdminLayout
      username={user.username}
      role={user.role}
      onLogout={() => setUser(null)}
    />
  ) : (
    <LoginPage onLogin={setUser} />
  );
}