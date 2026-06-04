import { useState, useEffect } from "react";
import { apiRequest } from "../../services/api";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null); // null | "add" | "edit" | "delete"
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({ username:"", password:"", fullName:"", email:"", role:"Cashier", status:"Active" });
  const [toast, setToast]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/users");
      setUsers(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ username:"", password:"", fullName:"", email:"", role:"Cashier", status:"Active" });
    setModal("add");
  };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ ...u, password:"" });
    setModal("edit");
  };
  const openDelete = (u) => { setSelected(u); setModal("delete"); };

  const handleSave = async () => {
    if (!form.username.trim() || !form.fullName.trim()) return;
    if (modal === "add" && !form.password.trim()) {
      showToast("Password is required for new users.", "error");
      return;
    }

    try {
      const payload = { ...form };
      if (modal === "edit" && !payload.password) delete payload.password;

      if (modal === "add") {
        await apiRequest("/users", { method:"POST", body: JSON.stringify(payload) });
        showToast(`User "${form.username}" added successfully.`);
      } else {
        await apiRequest(`/users/${selected.id}`, { method:"PUT", body: JSON.stringify(payload) });
        showToast(`User "${form.username}" updated.`);
      }
      setModal(null);
      loadUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/users/${selected.id}`, { method:"DELETE" });
      showToast(`User "${selected.username}" deleted.`, "error");
      setModal(null);
      loadUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const roleColor = r => ({
    Administrator: "bg-emerald-100 text-emerald-700",
    Cashier:       "bg-teal-100 text-teal-700",
    Inventory:     "bg-cyan-100 text-cyan-700",
  }[r] || "bg-slate-100 text-slate-600");

  const updateForm = (name, value) => setForm(p => ({ ...p, [name]: value }));

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 transition-all
          ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
          <Icon d={toast.type==="error"?IC.xCircle:IC.check} size={16}/>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage system users and their roles.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 active:scale-95">
          <Icon d={IC.plus} size={15}/> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Icon d={IC.search} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…"
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"/>
          </div>
          <span className="text-xs text-slate-400 font-medium">{loading ? "Loading..." : `${filtered.length} records`}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70">
                {["#","Username","Full Name","Email","Role","Status","Actions"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors group">
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{String(i+1).padStart(2,"0")}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{u.username}</td>
                  <td className="px-5 py-3 text-slate-600">{u.fullName}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{u.email}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor(u.role)}`}>{u.role}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.status==="Active"?"bg-green-100 text-green-700":"bg-slate-100 text-slate-500"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>openEdit(u)} title="Edit"
                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                        <Icon d={IC.edit} size={13}/>
                      </button>
                      <button onClick={()=>openDelete(u)} title="Delete"
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                        <Icon d={IC.trash} size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal==="add"?"Add New User":"Edit User"} onClose={()=>setModal(null)}>
          <FormField label="Username" name="username" value={form.username} onChange={updateForm} />
          <FormField label={modal==="add"?"Password":"New Password"} name="password" type="password" value={form.password} onChange={updateForm} placeholder={modal==="edit"?"Leave blank to keep current password":"Password"} />
          <FormField label="Full Name" name="fullName" value={form.fullName} onChange={updateForm} />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={updateForm} />
          <FormField label="Role" name="role" value={form.role} onChange={updateForm} options={["Administrator","Cashier","Inventory"]} />
          <FormField label="Status" name="status" value={form.status} onChange={updateForm} options={["Active","Inactive"]} />
          <div className="flex gap-3 mt-2">
            <button onClick={()=>setModal(null)}
              className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md shadow-emerald-200 active:scale-95">
              {modal==="add"?"Add User":"Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal title="Delete User" onClose={()=>setModal(null)}>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon d={IC.trash} size={24} className="text-red-500"/>
            </div>
            <p className="text-slate-700 font-semibold mb-1">Delete <span className="text-red-600">"{selected?.username}"</span>?</p>
            <p className="text-slate-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)}
                className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all active:scale-95">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
