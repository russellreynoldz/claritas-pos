import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api";

export default function InventoryAdjustmentPage() {
  const [items, setItems] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const adjustedBy =
    user.fullName ||
    user.full_name ||
    user.name ||
    user.username ||
    "System User";

  const [form, setForm] = useState({
    item_id: "",
    item_name: "",
    current_stock: 0,
    adjustment_type: "Increase",
    quantity: 1,
    reason: "",
  });

  const newStock = useMemo(() => {
    const current = Number(form.current_stock || 0);
    const qty = Number(form.quantity || 0);

    if (form.adjustment_type === "Increase") return current + qty;
    if (form.adjustment_type === "Decrease") return current - qty;
    if (form.adjustment_type === "Set") return qty;

    return current;
  }, [form]);

  const showMessage = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const itemData = await apiRequest("/items");
      setItems(Array.isArray(itemData) ? itemData : []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load items");
    }

    try {
      const adjData = await apiRequest("/inventory-adjustments");
      setAdjustments(Array.isArray(adjData) ? adjData : []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load adjustments");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleItemChange = (e) => {
    const id = e.target.value;
    const item = items.find((i) => String(i.id) === String(id));

    setForm({
      ...form,
      item_id: id,
      item_name: item ? item.name : "",
      current_stock: item ? Number(item.stock || 0) : 0,
    });
  };

  const resetForm = () => {
    setForm({
      item_id: "",
      item_name: "",
      current_stock: 0,
      adjustment_type: "Increase",
      quantity: 1,
      reason: "",
    });
  };

  const saveAdjustment = async () => {
    if (!form.item_id) {
      showMessage("Please select item");
      return;
    }

    if (Number(form.quantity) < 0) {
      showMessage("Invalid quantity");
      return;
    }

    if (newStock < 0) {
      showMessage("Stock cannot be less than zero");
      return;
    }

    try {
      await apiRequest("/inventory-adjustments", {
        method: "POST",
        body: JSON.stringify({
          item_id: form.item_id,
          item_name: form.item_name,
          adjustment_type: form.adjustment_type,
          quantity: Number(form.quantity),
          reason: form.reason,
          adjusted_by: adjustedBy,
        }),
      });

      showMessage("Inventory adjusted successfully");
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Failed to save adjustment");
    }
  };

  const statusColor = (type) => {
    if (type === "Increase") return "bg-emerald-100 text-emerald-700";
    if (type === "Decrease") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {toast && (
        <div className="fixed right-5 top-5 z-[999] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shadow-sm">
        <p className="text-sm font-medium text-emerald-100">Transactions</p>
        <h1 className="text-2xl font-bold md:text-3xl">
          Inventory Adjustment
        </h1>
        <p className="mt-1 text-sm text-emerald-50">
          Increase, decrease, or set item stock manually.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard title="Total Items" value={items.length} />
        <SummaryCard title="Adjustments" value={adjustments.length} />
        <SummaryCard title="Adjusted By" value={adjustedBy} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-800">New Adjustment</h2>
            <p className="text-sm text-slate-500">
              Select item and choose adjustment type.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <InputGroup label="Item">
              <select
                value={form.item_id}
                onChange={handleItemChange}
                className="input"
              >
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - Stock: {item.stock}
                  </option>
                ))}
              </select>
            </InputGroup>

            <InputGroup label="Current Stock">
              <input
                value={form.current_stock}
                readOnly
                className="input bg-slate-100"
              />
            </InputGroup>

            <InputGroup label="Adjustment Type">
              <select
                value={form.adjustment_type}
                onChange={(e) =>
                  setForm({ ...form, adjustment_type: e.target.value })
                }
                className="input"
              >
                <option>Increase</option>
                <option>Decrease</option>
                <option>Set</option>
              </select>
            </InputGroup>

            <InputGroup
              label={
                form.adjustment_type === "Set"
                  ? "New Stock Quantity"
                  : "Quantity"
              }
            >
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                className="input"
              />
            </InputGroup>

            <div
              className={`rounded-2xl p-4 ${
                newStock < 0
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <p className="text-sm font-medium">New Stock After Adjustment</p>
              <p className="text-3xl font-black">{newStock}</p>
            </div>

            <InputGroup label="Reason">
              <textarea
                rows="3"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input"
                placeholder="Example: Damaged item, stock count correction..."
              />
            </InputGroup>

            <button
              onClick={saveAdjustment}
              className="w-full rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Save Adjustment
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-800">Adjustment History</h2>
            <p className="text-sm text-slate-500">
              All manual stock changes are recorded here.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-4 py-3 text-left">Adjustment No.</th>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">Old</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-center">New</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">By</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No adjustment records.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr
                      key={adj.id}
                      className="border-t border-slate-100 hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-3 font-semibold">
                        {adj.adjustment_no}
                      </td>
                      <td className="px-4 py-3">{adj.item_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(
                            adj.adjustment_type
                          )}`}
                        >
                          {adj.adjustment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {adj.old_stock}
                      </td>
                      <td className="px-4 py-3 text-center">{adj.quantity}</td>
                      <td className="px-4 py-3 text-center font-bold">
                        {adj.new_stock}
                      </td>
                      <td className="px-4 py-3">{adj.reason || "-"}</td>
                      <td className="px-4 py-3">{adj.adjusted_by || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .input {
          width: 100%;
          border-radius: 16px;
          border: 1px solid #cbd5e1;
          padding: 11px 14px;
          font-size: 14px;
          outline: none;
          color: #0f172a;
          background: white;
        }

        .input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 break-words text-2xl font-bold text-slate-800">
        {value}
      </h3>
    </div>
  );
}

function InputGroup({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}