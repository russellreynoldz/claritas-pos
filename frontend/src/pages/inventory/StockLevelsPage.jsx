import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function InventoryStockPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/items");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load items:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Stock Levels
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          View all items and their remaining stocks.
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
              placeholder="Search item, SKU, or category..."
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

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
                <th className="px-5 py-3 text-left font-semibold">Category</th>
                <th className="px-5 py-3 text-left font-semibold">Price</th>
                <th className="px-5 py-3 text-left font-semibold">Remaining Stock</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-emerald-50/40 transition-colors"
                >
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    {item.sku}
                  </td>

                  <td className="px-5 py-3 font-semibold text-slate-800">
                    {item.name}
                  </td>

                  <td className="px-5 py-3 text-slate-500">
                    {item.category}
                  </td>

                  <td className="px-5 py-3 font-semibold text-emerald-700">
                    {fmt(Number(item.price))}
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`font-bold ${
                        Number(item.stock) <= 5
                          ? "text-red-500"
                          : Number(item.stock) <= 15
                          ? "text-amber-500"
                          : "text-slate-700"
                      }`}
                    >
                      {item.stock}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">
                      {item.unit}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        Number(item.stock) <= 0
                          ? "bg-red-100 text-red-700"
                          : Number(item.stock) <= 5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {Number(item.stock) <= 0
                        ? "Out of Stock"
                        : Number(item.stock) <= 5
                        ? "Low Stock"
                        : "Available"}
                    </span>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400 text-sm"
                  >
                    No items found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400 text-sm"
                  >
                    Loading inventory...
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