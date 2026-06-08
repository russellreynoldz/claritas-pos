import { useState, useEffect } from "react";
import { apiRequest } from "../../services/api";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { fmt } from "../../utils/format";

export default function ItemsPage() {
  const [items, setItems]       = useState([]);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast]       = useState(null);
  const [form, setForm]         = useState({
    name:"", sku:"", category:"Electronics", price:"", cost:"", stock:"", unit:"pcs", status:"Active"
  });

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const loadItems = async () => {
    try {
      const data = await apiRequest("/items");
      setItems(data);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  useEffect(() => { loadItems(); }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ name:"", sku:"", category:"Electronics", price:"", cost:"", stock:"", unit:"pcs", status:"Active" });
    setModal("add");
  };
  const openEdit = (item) => { setSelected(item); setForm({...item, price:String(item.price), cost:String(item.cost), stock:String(item.stock)}); setModal("edit"); };
  const openDelete = (item) => { setSelected(item); setModal("delete"); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) return;
    const payload = { ...form, price: Number(form.price)||0, cost: Number(form.cost)||0, stock: Number(form.stock)||0 };
    try {
      if (modal === "add") {
        await apiRequest("/items", { method:"POST", body: JSON.stringify(payload) });
        showToast(`Item "${form.name}" added.`);
      } else {
        await apiRequest(`/items/${selected.id}`, { method:"PUT", body: JSON.stringify(payload) });
        showToast(`Item "${form.name}" updated.`);
      }
      setModal(null);
      loadItems();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/items/${selected.id}`, { method:"DELETE" });
      showToast(`Item "${selected.name}" deleted.`, "error");
      setModal(null);
      loadItems();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const catColor = c => ({
    Rice:   "bg-amber-100 text-amber-700",
    Feeds: "bg-blue-100 text-blue-700",
    //Accessories: "bg-purple-100 text-purple-700",
    //Lighting:    "bg-yellow-100 text-yellow-700",//
    Supplies:    "bg-emerald-100 text-emerald-700",
    //Office:      "bg-teal-100 text-teal-700",//
  }[c] || "bg-slate-100 text-slate-600");

  const updateForm = (name, value) => setForm(p => ({ ...p, [name]: value }));

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2
          ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
          <Icon d={toast.type==="error"?IC.xCircle:IC.check} size={16}/>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Items</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your product/item master list.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 active:scale-95">
          <Icon d={IC.plus} size={15}/> Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Icon d={IC.search} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…"
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"/>
          </div>
          <span className="text-xs text-slate-400 font-medium">{filtered.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70">
                {["#","SKU","Name","Category","Price","Cost","Stock","Status","Actions"].map(h=>(
                  <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item, i) => (
                <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors group">
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{String(i+1).padStart(2,"0")}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500 bg-slate-50/50">{item.sku}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{item.name}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor(item.category)}`}>{item.category}</span></td>
                  <td className="px-5 py-3 font-semibold text-emerald-700">{fmt(item.price)}</td>
                  <td className="px-5 py-3 text-slate-500">{fmt(item.cost)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-bold text-sm ${item.stock<=5?"text-red-500":item.stock<=15?"text-amber-500":"text-slate-700"}`}>
                      {item.stock}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.status==="Active"?"bg-green-100 text-green-700":"bg-slate-100 text-slate-500"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>openEdit(item)}
                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                        <Icon d={IC.edit} size={13}/>
                      </button>
                      <button onClick={()=>openDelete(item)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                        <Icon d={IC.trash} size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal==="add"?"Add New Item":"Edit Item"} onClose={()=>setModal(null)}>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Item Name" name="name" value={form.name} onChange={updateForm} span={2}/>
            <FormField label="SKU" name="sku" value={form.sku} onChange={updateForm} />
            <FormField label="Category" name="category" value={form.category} onChange={updateForm} options={["Feeds","Rice","Accessories","Supplies","Drinks"]}/>
            <FormField label="Price (₱)" name="price" type="number" value={form.price} onChange={updateForm}/>
            <FormField label="Cost (₱)" name="cost" type="number" value={form.cost} onChange={updateForm}/>
            <FormField label="Stock Qty" name="stock" type="number" value={form.stock} onChange={updateForm}/>
            <FormField label="Unit" name="unit" value={form.unit} onChange={updateForm} options={["pcs","box","set","kg","liter"]}/>
            <div className="col-span-2">
              <FormField label="Status" name="status" value={form.status} onChange={updateForm} options={["Active","Inactive"]}/>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={()=>setModal(null)}
              className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave}
              className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-md shadow-emerald-200 active:scale-95">
              {modal==="add"?"Add Item":"Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal title="Delete Item" onClose={()=>setModal(null)}>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon d={IC.trash} size={24} className="text-red-500"/>
            </div>
            <p className="text-slate-700 font-semibold mb-1">Delete <span className="text-red-600">"{selected?.name}"</span>?</p>
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
