import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

export default function CheckoutHistoryPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [sales, setSales] = useState([]);
  const [preview, setPreview] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);

  const loadSales = async () => {
    const data = await apiRequest(`/sales/history?date=${date}`);
    setSales(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadSales();
  }, [date]);

  const changeDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const openDetails = async (sale) => {
    try {
      setSelectedSale(sale);

      const data = await apiRequest(`/sales/${sale.id}/items`);
      setSaleItems(Array.isArray(data) ? data : []);

      setDetailsOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const totalCash = sales
    .filter((s) => String(s.payment_method).toLowerCase() === "cash")
    .reduce((sum, s) => sum + Number(s.total || 0), 0);

  const totalGcash = sales
    .filter((s) => String(s.payment_method).toLowerCase() === "gcash")
    .reduce((sum, s) => sum + Number(s.total || 0), 0);

  const overallTotal = sales.reduce(
    (sum, s) => sum + Number(s.total || 0),
    0
  );

  

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Checkout History
        </h1>
        <p className="text-slate-500">
          View previous checkout transactions by day.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl shadow">
        <button
          onClick={() => changeDate(-1)}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          Previous Day
        </button>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />

        <button
          onClick={() => changeDate(1)}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          Next Day
        </button>

        <button
          onClick={() => setDate(today)}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          Today
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800">
            <tr>
              <th className="p-3 text-left">Transaction No.</th>
              <th className="p-3 text-left">Date and Time</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Cashier</th>
              <th className="p-3 text-left">Payment Type</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-5 text-center text-slate-500">
                  No checkout history found.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  onDoubleClick={() => openDetails(sale)}
                  className="border-t hover:bg-green-50 cursor-pointer"
                >
                  <td className="p-3">{sale.transaction_no}</td>
                  <td className="p-3">
                  {new Date(sale.created_at)
                    .toLocaleString("en-PH", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(",", "")}
                </td>
                  <td className="p-3">{sale.customer || "Walk-in"}</td>
                  <td className="p-3">{sale.cashier_name || "N/A"}</td>
                  <td className="p-3 uppercase">
                    {sale.payment_method || "cash"}
                  </td>
                  <td className="p-3 text-right">
                    ₱{Number(sale.total || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="p-4 border-t bg-slate-50 space-y-2">
          <div className="flex justify-end font-semibold gap-2">
            <span>Total Cash Payment:</span>
            <span>₱{totalCash.toFixed(2)}</span>
          </div>

          <div className="flex justify-end font-semibold gap-2">
            <span>Total GCash Payment:</span>
            <span>₱{totalGcash.toFixed(2)}</span>
          </div>

          <div className="text-right font-bold text-lg border-t pt-2">
            Overall Total: ₱{overallTotal.toFixed(2)}
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => setPreview(true)}
              disabled={sales.length === 0}
              className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Print Daily History
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6">
            <div id="print-area" className="text-sm">
              <h2 className="text-center text-xl font-bold">
                Clarita's Mini Grocery
              </h2>
              <p className="text-center text-slate-500">
                Daily Checkout History
              </p>
              <p className="text-center text-slate-500">Date: {date}</p>

              <hr className="my-4" />

              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2 text-left">Transaction No.</th>
                    <th className="p-3 text-left">Date and Time</th>
                    <th className="border p-2 text-left">Customer</th>
                    <th className="border p-2 text-left">Cashier</th>
                    <th className="border p-2 text-left">Payment Type</th>
                    <th className="border p-2 text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="border p-2">{sale.transaction_no}</td>
                      <td className="border p-2">
                        {new Date(sale.created_at)
                          .toLocaleString("en-PH", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(",", "")}
                      </td>
                      <td className="border p-2">
                        {sale.customer || "Walk-in"}
                      </td>
                      <td className="border p-2">
                        {sale.cashier_name || "N/A"}
                      </td>
                      <td className="border p-2 uppercase">
                        {sale.payment_method || "cash"}
                      </td>
                      <td className="border p-2 text-right">
                        ₱{Number(sale.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 space-y-2">
                <div className="flex justify-end font-semibold gap-2">
                  <span>Total Cash Payment:</span>
                  <span>₱{totalCash.toFixed(2)}</span>
                </div>

                <div className="flex justify-end font-semibold gap-2">
                  <span>Total GCash Payment:</span>
                  <span>₱{totalGcash.toFixed(2)}</span>
                </div>
                <div className="text-right font-bold text-lg border-t pt-2">
                  Overall Total: ₱{overallTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5 no-print">
              <button
                onClick={() => setPreview(false)}
                className="flex-1 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              >
                Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">
              Transaction Details
            </h2>

            <p className="text-sm text-slate-500 mb-4">
              Transaction: {selectedSale.transaction_no}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <p>
                <b>Transaction:</b> {selectedSale.transaction_no}
              </p>
              <p>
                <b>Customer:</b> {selectedSale.customer || "Walk-in"}
              </p>
              <p>
                <b>Cashier:</b> {selectedSale.cashier_name || "N/A"}
              </p>
              <p>
                <b>Payment:</b> {selectedSale.payment_method || "cash"}
              </p>
              <p>
                <b>Time:</b> {selectedSale.time}
              </p>
              <p>
                <b>Total:</b> ₱{Number(selectedSale.total || 0).toFixed(2)}
              </p>
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border p-2 text-left">Item</th>
                  <th className="border p-2 text-center">Qty</th>
                  <th className="border p-2 text-right">Price</th>
                  <th className="border p-2 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {saleItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="border p-4 text-center text-slate-500"
                    >
                      No items found.
                    </td>
                  </tr>
                ) : (
                  saleItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border p-2">{item.item_name}</td>
                      <td className="border p-2 text-center">{item.qty}</td>
                      <td className="border p-2 text-right">
                        ₱{Number(item.price || 0).toFixed(2)}
                      </td>
                      <td className="border p-2 text-right">
                        ₱{Number(item.line_total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setDetailsOpen(false)}
                className="px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            #print-area, #print-area * {
              visibility: visible;
            }

            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }

            .no-print {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
}