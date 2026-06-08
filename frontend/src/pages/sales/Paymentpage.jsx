import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function PaymentPage() {
  const [credits, setCredits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  const loadCredits = async () => {
    const data = await apiRequest("/credit-sales/unpaid");
    setCredits(Array.isArray(data) ? data : []);
  };

  const loadPayments = async (credit) => {
    setSelected(credit);
    const data = await apiRequest(`/credit-sales/${credit.id}/payments`);
    setPayments(Array.isArray(data) ? data : []);
    setAmount(Number(credit.balance || credit.total || 0).toFixed(2));
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const savePayment = async () => {
    if (!selected) return alert("Select a credit sale first.");

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      await apiRequest(`/credit-sales/${selected.id}/payment`, {
        method: "POST",
        body: JSON.stringify({
          payment_amount: Number(amount),
          payment_method: method,
          received_by:
            user.fullName || user.full_name || user.name || user.username || "Cashier",
        }),
      });

      alert("Payment saved successfully");

      setSelected(null);
      setPayments([]);
      setAmount("");
      await loadCredits();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Payment</h1>
        <p className="text-slate-500">Collect payment for credit sales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-50 text-green-800">
              <tr>
                <th className="p-3 text-left">Credit No.</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              {credits.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-5 text-center text-slate-500">
                    No unpaid credit sales.
                  </td>
                </tr>
              ) : (
                credits.map((credit) => (
                  <tr
                    key={credit.id}
                    onClick={() => loadPayments(credit)}
                    className={`border-t cursor-pointer hover:bg-green-50 ${
                      selected?.id === credit.id ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="p-3">{credit.credit_no || credit.id}</td>
                    <td className="p-3">{credit.customer_name}</td>
                    <td className="p-3 text-right">{fmt(Number(credit.total || 0))}</td>
                    <td className="p-3 text-right">{fmt(Number(credit.paid_amount || 0))}</td>
                    <td className="p-3 text-right font-bold text-red-600">
                      {fmt(Number(credit.balance || credit.total || 0))}
                    </td>
                    <td className="p-3 text-center uppercase">{credit.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <h2 className="font-bold text-slate-800">Receive Payment</h2>

          {!selected ? (
            <p className="text-slate-500 text-sm">
              Select a credit sale from the table.
            </p>
          ) : (
            <>
              <div className="text-sm space-y-1">
                <p><b>Credit No:</b> {selected.credit_no || selected.id}</p>
                <p><b>Customer:</b> {selected.customer_name}</p>
                <p><b>Total:</b> {fmt(Number(selected.total || 0))}</p>
                <p><b>Paid:</b> {fmt(Number(selected.paid_amount || 0))}</p>
                <p><b>Balance:</b> {fmt(Number(selected.balance || selected.total || 0))}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">
                  Payment Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <button
                onClick={savePayment}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300"
              >
                {loading ? "Saving..." : "Save Payment"}
              </button>

              <div>
                <h3 className="font-bold text-sm mt-4 mb-2">Payment History</h3>

                {payments.length === 0 ? (
                  <p className="text-xs text-slate-500">No payment yet.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {payments.map((p) => (
                      <div key={p.id} className="border rounded-lg p-2">
                        <div className="flex justify-between">
                          <span>{p.payment_method}</span>
                          <b>{fmt(Number(p.payment_amount || 0))}</b>
                        </div>
                        <p className="text-xs text-slate-500">
                          {p.created_at}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}