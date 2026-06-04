import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function SalesReportPage() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const data = await apiRequest("/sales");
    setSales(Array.isArray(data) ? data : []);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return sales.filter(
      (sale) =>
        sale.tx_id?.toLowerCase().includes(q) ||
        sale.customer?.toLowerCase().includes(q) ||
        sale.payment_method?.toLowerCase().includes(q)
    );
  }, [sales, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Sales Report
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          View completed sales transactions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Icon
              d={IC.search}
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction, customer, payment..."
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
                <th className="px-5 py-3 text-left font-semibold">TX ID</th>
                <th className="px-5 py-3 text-left font-semibold">Customer</th>
                <th className="px-5 py-3 text-left font-semibold">Payment</th>
                <th className="px-5 py-3 text-left font-semibold">Items</th>
                <th className="px-5 py-3 text-left font-semibold">Subtotal</th>
                <th className="px-5 py-3 text-left font-semibold">Discount</th>
                <th className="px-5 py-3 text-left font-semibold">Total</th>
                <th className="px-5 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((sale) => (
                <tr key={sale.id} className="hover:bg-emerald-50/40">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {sale.tx_id}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {sale.customer}
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-500">
                    {sale.payment_method}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {sale.total_items}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {fmt(Number(sale.subtotal))}
                  </td>
                  <td className="px-5 py-3 text-red-500">
                    -{fmt(Number(sale.discount))}
                  </td>
                  <td className="px-5 py-3 font-bold text-emerald-700">
                    {fmt(Number(sale.total))}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    {new Date(sale.created_at).toLocaleString("en-PH")}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No sales found.
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