import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./layouts/AdminLayout";

export default function App() {
  const [user, setUser] = useState(null);

  return user
    ? <AdminLayout username={user} />
    : <LoginPage onLogin={u => setUser(u)} />;
}
