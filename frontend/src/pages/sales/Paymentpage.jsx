import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function PaymentPage() {
  const [credits, setCredits] = useState([]);
  const [search, setSearch] = useState("");
  const [paying, setPaying] = useState(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const data = await apiRequest("/credit-sales");
    setCredits(Array.isArray(data) ? data : []);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return credits.filter(
      (c) =>
        c.credit_no?.toLowerCase().includes(q) ||
        c.customer_name?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q)
    );
  }, [credits, search]);

  const statusStyle = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "fully paid") return "bg-green-100 text-green-700";
    if (s === "partially paid") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const handlePay = async () => {
    if (!paying || !amount) return;

    try {
      await apiRequest(`/credit-sales/${paying.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });

      setPaying(null);
      setAmount("");
      loadCredits();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (credit) => {
    if (!confirm(`Delete credit transaction ${credit.credit_no}?`)) return;

    await apiRequest(`/credit-sales/${credit.id}`, {
      method: "DELETE",
    });

    loadCredits();
  };

  return (
    <div className="space-y-4 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Payment
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage credit payments and balances.
        </p>
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
              placeholder="Search credits..."
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
                <th className="px-5 py-3 text-left font-semibold">Credit No</th>
                <th className="px-5 py-3 text-left font-semibold">Customer</th>
                <th className="px-5 py-3 text-left font-semibold">Total</th>
                <th className="px-5 py-3 text-left font-semibold">Paid</th>
                <th className="px-5 py-3 text-left font-semibold">Balance</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((credit, index) => (
                <tr key={credit.id} className="hover:bg-emerald-50/40 group">
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {credit.credit_no}
                  </td>

                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {credit.customer_name}
                  </td>

                  <td className="px-5 py-3 font-bold text-slate-700">
                    {fmt(Number(credit.total))}
                  </td>

                  <td className="px-5 py-3 text-emerald-700 font-bold">
                    {fmt(Number(credit.paid_amount || 0))}
                  </td>

                  <td className="px-5 py-3 text-red-500 font-bold">
                    {fmt(Number(credit.balance || 0))}
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle(
                        credit.status
                      )}`}
                    >
                      {credit.status}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {new Date(credit.created_at).toLocaleString("en-PH")}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPaying(credit);
                          setAmount("");
                        }}
                        disabled={String(credit.status).toLowerCase() === "fully paid"}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40"
                      >
                        Pay
                      </button>

                      <button
                        onClick={() => handleDelete(credit)}
                        className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    No credit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50">
              <h3 className="font-bold text-slate-800">Pay Credit</h3>
              <p className="text-xs text-slate-500">{paying.customer_name}</p>
            </div>

            <div className="p-6 space-y-3">
              <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total</span>
                  <strong>{fmt(Number(paying.total))}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Paid</span>
                  <strong>{fmt(Number(paying.paid_amount || 0))}</strong>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Balance</span>
                  <strong>{fmt(Number(paying.balance || 0))}</strong>
                </div>
              </div>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-emerald-400"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setPaying(null)}
                  className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePay}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}