import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <Icon d={IC.close} size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    status: "Active",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadCustomers = async () => {
    try {
      const data = await apiRequest("/customers");
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openAdd = () => {
    setForm({ name: "", phone: "", address: "", status: "Active" });
    setModal("add");
  };

  const openEdit = (customer) => {
    setSelected(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      status: customer.status || "Active",
    });
    setModal("edit");
  };

  const openDelete = (customer) => {
    setSelected(customer);
    setModal("delete");
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Customer name is required.", "error");
      return;
    }

    try {
      if (modal === "add") {
        await apiRequest("/customers", {
          method: "POST",
          body: JSON.stringify(form),
        });
        showToast("Customer added successfully.");
      } else {
        await apiRequest(`/customers/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        showToast("Customer updated successfully.");
      }

      setModal(null);
      loadCustomers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/customers/${selected.id}`, {
        method: "DELETE",
      });

      showToast("Customer deleted.", "error");
      setModal(null);
      loadCustomers();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${
            toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
          }`}
        >
          <Icon d={toast.type === "error" ? IC.xCircle : IC.check} size={16} />
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Customers
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage customer records for credit transactions.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 active:scale-95"
        >
          <Icon d={IC.plus} size={15} />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-xs">
            <Icon
              d={IC.search}
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filtered.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="px-5 py-3 text-left font-semibold">#</th>
                <th className="px-5 py-3 text-left font-semibold">Name</th>
                <th className="px-5 py-3 text-left font-semibold">Phone</th>
                <th className="px-5 py-3 text-left font-semibold">Address</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((customer, index) => (
                <tr
                  key={customer.id}
                  className="hover:bg-emerald-50/40 transition-colors group"
                >
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {customer.name}
                  </td>

                  <td className="px-5 py-3 text-slate-500">
                    {customer.phone || "—"}
                  </td>

                  <td className="px-5 py-3 text-slate-500">
                    {customer.address || "—"}
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        customer.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(customer)}
                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center"
                      >
                        <Icon d={IC.edit} size={13} />
                      </button>

                      <button
                        onClick={() => openDelete(customer)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"
                      >
                        <Icon d={IC.trash} size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400 text-sm"
                  >
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "add" ? "Add Customer" : "Edit Customer"}
          onClose={() => setModal(null)}
        >
          <Field
            label="Customer Name"
            value={form.name}
            onChange={(v) => setForm((p) => ({ ...p, name: v }))}
          />

          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          />

          <Field
            label="Address"
            value={form.address}
            onChange={(v) => setForm((p) => ({ ...p, address: v }))}
          />

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setModal(null)}
              className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-200"
            >
              {modal === "add" ? "Add Customer" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal title="Delete Customer" onClose={() => setModal(null)}>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon d={IC.trash} size={24} className="text-red-500" />
            </div>

            <p className="text-slate-700 font-semibold mb-1">
              Delete{" "}
              <span className="text-red-600">"{selected?.name}"</span>?
            </p>

            <p className="text-slate-400 text-sm mb-6">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}