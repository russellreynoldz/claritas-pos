import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    supplier_id: "",
    supplier_name: "",
    order_date: today,
    expected_date: "",
    notes: "",
  });

  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);
  const [cart, setCart] = useState([]);

  const peso = (num) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(num || 0));

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.cost, 0);
  }, [cart]);

  const totalOrdersAmount = orders.reduce(
    (sum, order) => sum + Number(order.subtotal || 0),
    0
  );

  const showMessage = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const supplierData = await apiRequest("/suppliers");
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
    } catch (err) {
      console.error("SUPPLIER ERROR:", err);
      showMessage("Failed to load suppliers");
    }

    try {
      const itemData = await apiRequest("/items");
      setItems(Array.isArray(itemData) ? itemData : []);
    } catch (err) {
      console.error("ITEM ERROR:", err);
      showMessage("Failed to load items");
    }

    try {
      const poData = await apiRequest("/purchase-orders");
      setOrders(Array.isArray(poData) ? poData : []);
    } catch (err) {
      console.error("PO ERROR:", err);
      showMessage("Failed to load purchase orders");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      supplier_id: "",
      supplier_name: "",
      order_date: today,
      expected_date: "",
      notes: "",
    });

    setSelectedItemId("");
    setQty(1);
    setCost(0);
    setCart([]);
  };

  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find(
      (s) => String(s.id) === String(supplierId)
    );

    setForm({
      ...form,
      supplier_id: supplierId,
      supplier_name: supplier ? supplier.name : "",
    });
  };

  const handleItemChange = (e) => {
    const itemId = e.target.value;
    const item = items.find((i) => String(i.id) === String(itemId));

    setSelectedItemId(itemId);
    setCost(item ? Number(item.cost || 0) : 0);
  };

  const addItem = () => {
    const item = items.find((i) => String(i.id) === String(selectedItemId));

    if (!item) {
      showMessage("Please select an item");
      return;
    }

    if (Number(qty) <= 0) {
      showMessage("Invalid quantity");
      return;
    }

    if (Number(cost) <= 0) {
      showMessage("Invalid cost");
      return;
    }

    const existing = cart.find(
      (c) => String(c.item_id) === String(item.id)
    );

    if (existing) {
      setCart(
        cart.map((c) =>
          String(c.item_id) === String(item.id)
            ? {
                ...c,
                qty: Number(c.qty) + Number(qty),
                cost: Number(cost),
              }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          item_id: item.id,
          item_name: item.name,
          qty: Number(qty),
          cost: Number(cost),
        },
      ]);
    }

    setSelectedItemId("");
    setQty(1);
    setCost(0);
  };

  const removeItem = (itemId) => {
    setCart(cart.filter((item) => item.item_id !== itemId));
  };

  const savePurchaseOrder = async () => {
    if (!form.supplier_id) {
      showMessage("Please select supplier");
      return;
    }

    if (cart.length === 0) {
      showMessage("Please add item");
      return;
    }

    try {
      await apiRequest("/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          items: cart,
        }),
      });

      showMessage("Purchase order saved");
      resetForm();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error("SAVE PO ERROR:", err);
      showMessage(err.message || "Failed to save purchase order");
    }
  };

  const viewDetails = async (id) => {
    try {
      const data = await apiRequest(`/purchase-orders/${id}`);
      setViewOrder(data);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load details");
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Delete this purchase order?")) return;

    try {
      await apiRequest(`/purchase-orders/${id}`, {
        method: "DELETE",
      });

      showMessage("Purchase order deleted");
      loadData();
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete purchase order");
    }
  };

  const printOrder = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {toast && (
        <div className="no-print fixed top-5 right-5 z-[999] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="no-print mb-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100">
              Transactions
            </p>
            <h1 className="text-2xl font-bold md:text-3xl">
              Purchase Orders
            </h1>
            <p className="mt-1 text-sm text-emerald-50">
              Create supplier purchase orders and print PO documents.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-2xl bg-white px-5 py-3 font-semibold text-emerald-700 shadow hover:bg-emerald-50"
          >
            + New Purchase Order
          </button>
        </div>
      </div>

      <div className="no-print mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard title="Total Orders" value={orders.length} />
        <SummaryCard title="Suppliers" value={suppliers.length} />
        <SummaryCard title="Total PO Amount" value={peso(totalOrdersAmount)} />
      </div>

      <div className="no-print overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-800">Purchase Order List</h2>
          <p className="text-sm text-slate-500">
            Click View to see print preview.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="px-4 py-3 text-left">PO No.</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Order Date</th>
                <th className="px-4 py-3 text-left">Expected</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No purchase orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr
                    key={po.id}
                    className="border-t border-slate-100 hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {po.po_no}
                    </td>
                    <td className="px-4 py-3">{po.supplier_name}</td>
                    <td className="px-4 py-3">{po.order_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      {po.expected_date ? po.expected_date.slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {peso(po.subtotal)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => viewDetails(po.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          View / Print
                        </button>
                        <button
                          onClick={() => deleteOrder(po.id)}
                          className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-600 p-5 text-white">
              <div>
                <h2 className="text-xl font-bold">New Purchase Order</h2>
                <p className="text-sm text-emerald-100">
                  Select supplier, add items, then save.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-full bg-white/20 px-3 py-1 text-lg hover:bg-white/30"
              >
                ×
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <InputGroup label="Supplier">
                  <select
                    value={form.supplier_id}
                    onChange={handleSupplierChange}
                    className="input"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </InputGroup>

                <InputGroup label="Order Date">
                  <input
                    type="date"
                    value={form.order_date}
                    onChange={(e) =>
                      setForm({ ...form, order_date: e.target.value })
                    }
                    className="input"
                  />
                </InputGroup>

                <InputGroup label="Expected Date">
                  <input
                    type="date"
                    value={form.expected_date}
                    onChange={(e) =>
                      setForm({ ...form, expected_date: e.target.value })
                    }
                    className="input"
                  />
                </InputGroup>
              </div>

              <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                <h3 className="mb-3 font-bold text-emerald-800">Add Items</h3>

                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <label className="label">Item</label>
                    <select
                      value={selectedItemId}
                      onChange={handleItemChange}
                      className="input bg-white"
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="input bg-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="label">Cost</label>
                    <input
                      type="number"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="input bg-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      onClick={addItem}
                      className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Cost</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          No items added.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => (
                        <tr key={item.item_id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium">{item.item_name}</td>
                          <td className="px-4 py-3 text-center">{item.qty}</td>
                          <td className="px-4 py-3 text-right">{peso(item.cost)}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {peso(item.qty * item.cost)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeItem(item.item_id)}
                              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5">
                <label className="label">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="3"
                  className="input"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between">
                <div className="rounded-2xl bg-slate-100 px-5 py-3 text-xl font-bold text-slate-800">
                  Total: {peso(total)}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={savePurchaseOrder}
                    className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                  >
                    Save Purchase Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="no-print flex items-center justify-between bg-slate-900 p-5 text-white">
              <div>
                <h2 className="text-xl font-bold">Print Preview</h2>
                <p className="text-sm text-slate-300">{viewOrder.po_no}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={printOrder}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Print
                </button>

                <button
                  onClick={() => setViewOrder(null)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto bg-slate-100 p-5 print-preview-wrapper">
              <div className="print-area mx-auto bg-white p-8 text-slate-900 shadow-lg">
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-black uppercase">
                        Clarita's Mini Grocery
                      </h1>
                      <p className="text-sm text-slate-600">
                        Purchase Order Document
                      </p>
                    </div>

                    <div className="text-right">
                      <h2 className="text-2xl font-black uppercase">
                        Purchase Order
                      </h2>
                      <p className="mt-1 text-sm">
                        <strong>PO No:</strong> {viewOrder.po_no}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-300 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                      Supplier
                    </p>
                    <p className="text-lg font-bold">
                      {viewOrder.supplier_name}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-300 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                      Order Information
                    </p>
                    <p>
                      <strong>Order Date:</strong>{" "}
                      {viewOrder.order_date?.slice(0, 10)}
                    </p>
                    <p>
                      <strong>Expected Date:</strong>{" "}
                      {viewOrder.expected_date
                        ? viewOrder.expected_date.slice(0, 10)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-400">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {viewOrder.items?.map((item) => (
                        <tr key={item.id} className="border-t border-slate-300">
                          <td className="px-4 py-3">{item.item_name}</td>
                          <td className="px-4 py-3 text-center">{item.qty}</td>
                          <td className="px-4 py-3 text-right">
                            {peso(item.cost)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {peso(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="border-t-2 border-slate-900">
                        <td colSpan="3" className="px-4 py-4 text-right text-lg font-bold">
                          Grand Total
                        </td>
                        <td className="px-4 py-4 text-right text-lg font-black">
                          {peso(viewOrder.subtotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {viewOrder.notes && (
                  <div className="mt-6 rounded-xl border border-slate-300 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Notes
                    </p>
                    <p className="mt-2 text-sm">{viewOrder.notes}</p>
                  </div>
                )}
                <br /><br />
                <div className="text-center">
                  <div className="mb-2 font-semibold text-slate-900">
                    {user.fullName ||
                      user.full_name ||
                      user.name ||
                      user.username ||
                      "System User"}
                  </div>

                  <div className="border-t border-slate-900 w-72 mx-auto"></div>

                  <div className="mt-2 text-sm text-slate-600">
                    Prepared By
                  </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-500">
                  This is a system-generated purchase order.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

        .print-area {
          width: 210mm;
          min-height: 297mm;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-area,
          .print-area * {
            visibility: visible !important;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .no-print {
            display: none !important;
          }

          .print-preview-wrapper {
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
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