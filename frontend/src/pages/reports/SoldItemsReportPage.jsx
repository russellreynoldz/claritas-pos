import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function SoldItemsReportPage({ period = "daily", title = "Sold Items" }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, [period]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/reports/sold-items/${period}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load sold items:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return items.filter(
      (item) =>
        item.item_name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalQty = filtered.reduce(
    (sum, item) => sum + Number(item.total_qty_sold || 0),
    0
  );

  const totalSales = filtered.reduce(
    (sum, item) => sum + Number(item.total_sales || 0),
    0
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          View items sold for this {period}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Quantity Sold
          </p>
          <p className="text-2xl font-bold text-slate-800">
            {totalQty}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            Total Sales
          </p>
          <p className="text-2xl font-bold text-emerald-700">
            {fmt(totalSales)}
          </p>
        </div>
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
              placeholder="Search item or SKU..."
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <button
            onClick={loadItems}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            Refresh
          </button>

          <span className="text-xs text-slate-400 font-medium">
            {loading ? "Loading..." : `${filtered.length} records`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70">
                <th className="px-5 py-3 text-left font-semibold">#</th>
                <th className="px-5 py-3 text-left font-semibold">SKU</th>
                <th className="px-5 py-3 text-left font-semibold">Item Name</th>
                <th className="px-5 py-3 text-left font-semibold">Qty Sold</th>
                <th className="px-5 py-3 text-left font-semibold">Price</th>
                <th className="px-5 py-3 text-left font-semibold">Total Sales</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading report...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No sold items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={`${item.item_id}-${item.sku}`} className="hover:bg-emerald-50/40">
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {item.sku}
                    </td>

                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {item.item_name}
                    </td>

                    <td className="px-5 py-3 font-bold text-slate-700">
                      {item.total_qty_sold}
                    </td>

                    <td className="px-5 py-3 text-slate-600">
                      {fmt(Number(item.price))}
                    </td>

                    <td className="px-5 py-3 font-bold text-emerald-700">
                      {fmt(Number(item.total_sales))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}