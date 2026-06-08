import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api";

export default function ReceiveItemsPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [receivings, setReceivings] = useState([]);

  const [selectedPoId, setSelectedPoId] = useState("");
  const [selectedPo, setSelectedPo] = useState(null);
  const [poItems, setPoItems] = useState([]);

  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewReceiving, setViewReceiving] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const preparedBy =
    user.fullName ||
    user.full_name ||
    user.name ||
    user.username ||
    "System User";

  const peso = (num) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(num || 0));

  const receiveTotal = useMemo(() => {
    return poItems.reduce(
      (sum, item) =>
        sum + Number(item.qty_received || 0) * Number(item.cost || 0),
      0
    );
  }, [poItems]);

  const showMessage = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const poData = await apiRequest("/purchase-orders");
      setPurchaseOrders(Array.isArray(poData) ? poData : []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load purchase orders");
    }

    try {
      const receiveData = await apiRequest("/receivings");
      setReceivings(Array.isArray(receiveData) ? receiveData : []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load receivings");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadPoItems = async (poId) => {
    setSelectedPoId(poId);

    if (!poId) {
      setSelectedPo(null);
      setPoItems([]);
      return;
    }

    try {
      const data = await apiRequest(`/purchase-orders/${poId}/receiving-items`);

      setSelectedPo(data.po);

      const mappedItems = data.items.map((item) => ({
        ...item,
        qty_received: Number(item.remaining_qty) > 0 ? Number(item.remaining_qty) : 0,
      }));

      setPoItems(mappedItems);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load PO items");
    }
  };

  const changeReceivedQty = (itemId, value) => {
    setPoItems((prev) =>
      prev.map((item) => {
        if (String(item.item_id) !== String(itemId)) return item;

        let qty = Number(value || 0);

        if (qty < 0) qty = 0;
        if (qty > Number(item.remaining_qty)) qty = Number(item.remaining_qty);

        return {
          ...item,
          qty_received: qty,
        };
      })
    );
  };

  const saveReceiving = async () => {
    if (!selectedPo) {
      showMessage("Select purchase order first");
      return;
    }

    const itemsToReceive = poItems.filter(
      (item) => Number(item.qty_received) > 0
    );

    if (itemsToReceive.length === 0) {
      showMessage("Enter received quantity");
      return;
    }

    try {
      await apiRequest("/receivings", {
        method: "POST",
        body: JSON.stringify({
          po_id: selectedPo.id,
          po_no: selectedPo.po_no,
          supplier_name: selectedPo.supplier_name,
          received_date: receivedDate,
          received_by: preparedBy,
          notes,
          items: itemsToReceive.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            qty_received: Number(item.qty_received),
            cost: Number(item.cost),
          })),
        }),
      });

      showMessage("Receiving saved. Inventory updated.");

      setSelectedPoId("");
      setSelectedPo(null);
      setPoItems([]);
      setNotes("");
      setReceivedDate(new Date().toISOString().slice(0, 10));

      loadData();
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Failed to save receiving");
    }
  };

  const viewDetails = async (id) => {
    try {
      const data = await apiRequest(`/receivings/${id}`);
      setViewReceiving(data);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load receiving details");
    }
  };

  const printReceiving = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {toast && (
        <div className="no-print fixed right-5 top-5 z-[999] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="no-print mb-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shadow-sm">
        <p className="text-sm font-medium text-emerald-100">Transactions</p>
        <h1 className="text-2xl font-bold md:text-3xl">Receive Items</h1>
        <p className="mt-1 text-sm text-emerald-50">
          Receive purchase order items and automatically add them to inventory.
        </p>
      </div>

      <div className="no-print mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard title="Purchase Orders" value={purchaseOrders.length} />
        <SummaryCard title="Receiving Records" value={receivings.length} />
        <SummaryCard
          title="Current Receive Total"
          value={peso(receiveTotal)}
        />
      </div>

      <div className="no-print grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-800">New Receiving</h2>
            <p className="text-sm text-slate-500">
              Select a PO and input received quantity.
            </p>
          </div>

          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <InputGroup label="Purchase Order">
                <select
                  value={selectedPoId}
                  onChange={(e) => loadPoItems(e.target.value)}
                  className="input"
                >
                  <option value="">Select purchase order</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_no} - {po.supplier_name}
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label="Received Date">
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="input"
                />
              </InputGroup>
            </div>

            {selectedPo && (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                <p className="font-bold text-emerald-800">
                  {selectedPo.po_no}
                </p>
                <p className="text-sm text-emerald-700">
                  Supplier: {selectedPo.supplier_name}
                </p>
                <p className="text-sm text-emerald-700">
                  Prepared By: {preparedBy}
                </p>
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-center">Ordered</th>
                    <th className="px-4 py-3 text-center">Received</th>
                    <th className="px-4 py-3 text-center">Remaining</th>
                    <th className="px-4 py-3 text-center">Receive Now</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {poItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Select a purchase order.
                      </td>
                    </tr>
                  ) : (
                    poItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-medium">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.ordered_qty}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.received_qty}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.remaining_qty}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.remaining_qty}
                            value={item.qty_received}
                            onChange={(e) =>
                              changeReceivedQty(item.item_id, e.target.value)
                            }
                            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center outline-none focus:border-emerald-500"
                            disabled={Number(item.remaining_qty) <= 0}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {peso(item.cost)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {peso(Number(item.qty_received || 0) * Number(item.cost || 0))}
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
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                placeholder="Optional notes..."
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between">
              <div className="rounded-2xl bg-slate-100 px-5 py-3 text-xl font-bold text-slate-800">
                Total: {peso(receiveTotal)}
              </div>

              <button
                onClick={saveReceiving}
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                Save Receiving & Update Inventory
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-800">Receiving History</h2>
            <p className="text-sm text-slate-500">Latest received items.</p>
          </div>

          <div className="max-h-[650px] overflow-y-auto p-4">
            {loading ? (
              <p className="py-8 text-center text-slate-500">Loading...</p>
            ) : receivings.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                No receiving records.
              </p>
            ) : (
              <div className="space-y-3">
                {receivings.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-slate-200 p-4 hover:bg-emerald-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">
                          {rec.receive_no}
                        </p>
                        <p className="text-sm text-slate-500">
                          {rec.po_no}
                        </p>
                        <p className="text-sm text-slate-500">
                          {rec.supplier_name}
                        </p>
                      </div>

                      <button
                        onClick={() => viewDetails(rec.id)}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        View
                      </button>
                    </div>

                    <div className="mt-3 flex justify-between text-sm">
                      <span>{rec.received_date?.slice(0, 10)}</span>
                      <strong>{peso(rec.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewReceiving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="no-print flex items-center justify-between bg-slate-900 p-5 text-white">
              <div>
                <h2 className="text-xl font-bold">Receiving Preview</h2>
                <p className="text-sm text-slate-300">
                  {viewReceiving.receive_no}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={printReceiving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Print
                </button>

                <button
                  onClick={() => setViewReceiving(null)}
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
                        Receiving Report
                      </p>
                    </div>

                    <div className="text-right">
                      <h2 className="text-2xl font-black uppercase">
                        Receiving
                      </h2>
                      <p className="mt-1 text-sm">
                        <strong>RR No:</strong> {viewReceiving.receive_no}
                      </p>
                      <p className="text-sm">
                        <strong>PO No:</strong> {viewReceiving.po_no}
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
                      {viewReceiving.supplier_name}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-300 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                      Receiving Information
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {viewReceiving.received_date?.slice(0, 10)}
                    </p>
                    <p>
                      <strong>Received By:</strong>{" "}
                      {viewReceiving.received_by || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-400">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-center">Qty Received</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {viewReceiving.items?.map((item) => (
                        <tr key={item.id} className="border-t border-slate-300">
                          <td className="px-4 py-3">{item.item_name}</td>
                          <td className="px-4 py-3 text-center">
                            {item.qty_received}
                          </td>
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
                        <td
                          colSpan="3"
                          className="px-4 py-4 text-right text-lg font-bold"
                        >
                          Grand Total
                        </td>
                        <td className="px-4 py-4 text-right text-lg font-black">
                          {peso(viewReceiving.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {viewReceiving.notes && (
                  <div className="mt-6 rounded-xl border border-slate-300 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Notes
                    </p>
                    <p className="mt-2 text-sm">{viewReceiving.notes}</p>
                  </div>
                )}

                <div className="mt-12 grid grid-cols-2 gap-12">
                  <div className="text-center">
                    <div className="mb-2 font-semibold text-slate-900">
                      {viewReceiving.received_by || preparedBy}
                    </div>
                    <div className="mx-auto w-72 border-t border-slate-900"></div>
                    <div className="mt-2 text-sm text-slate-600">
                      Received By
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-2 font-semibold text-slate-900">
                      &nbsp;
                    </div>
                    <div className="mx-auto w-72 border-t border-slate-900"></div>
                    <div className="mt-2 text-sm text-slate-600">
                      Checked By
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-center text-xs text-slate-500">
                  This receiving report automatically updates inventory stock.
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