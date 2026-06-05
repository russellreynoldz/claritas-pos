import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { IC } from "../data/icons";
import { apiRequest } from "../services/api";
import { fmt } from "../utils/format";

export default function DashboardPage() {
  const [data, setData] = useState({
    salesToday: 0,
    inventoryItems: 0,
    lowStockItems: 0,
    monthlyProfit: 0,
    recentSales: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await apiRequest("/dashboard");
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  const stats = [
    {
      label: "Sales Today",
      value: fmt(Number(data.salesToday || 0)),
      icon: "bag",
      grad: "from-emerald-500 to-teal-600",
    },
    {
      label: "Inventory Items",
      value: Number(data.inventoryItems || 0).toLocaleString(),
      icon: "box",
      grad: "from-cyan-500 to-emerald-600",
    },
    {
      label: "Low Stock Items",
      value: Number(data.lowStockItems || 0).toLocaleString(),
      icon: "bell",
      grad: "from-amber-400 to-orange-500",
    },
    {
      label: "Monthly Profit",
      value: fmt(Number(data.monthlyProfit || 0)),
      icon: "trending",
      grad: "from-green-400 to-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time overview from your database.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            </div>

            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md`}
            >
              <Icon d={IC[s.icon]} size={18} className="text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Sales</h2>
          <button
            onClick={loadDashboard}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="px-6 py-3 text-left font-semibold">TX ID</th>
                <th className="px-6 py-3 text-left font-semibold">Customer</th>
                <th className="px-6 py-3 text-left font-semibold">Payment</th>
                <th className="px-6 py-3 text-left font-semibold">Total</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {data.recentSales?.map((sale) => (
                <tr key={sale.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">
                    {sale.tx_id}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-700">
                    {sale.customer}
                  </td>
                  <td className="px-6 py-3 capitalize text-slate-500">
                    {sale.payment_method}
                  </td>
                  <td className="px-6 py-3 font-bold text-emerald-700">
                    {fmt(Number(sale.total))}
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {new Date(sale.created_at).toLocaleString("en-PH")}
                  </td>
                </tr>
              ))}

              {data.recentSales?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No recent sales yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}