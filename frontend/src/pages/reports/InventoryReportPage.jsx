import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

export default function InventoryReportPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);

  const getStockStatus = (stock) => {
    const qty = Number(stock);

    if (qty <= 0) return "Out of Stock";
    if (qty <= 10) return "Low Stock";
    if (qty <= 50) return "In Stock";
    return "High Stock";
  };

  const loadData = async () => {
    const data = await apiRequest("/items");
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();

    return (
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort(
    (a, b) => Number(a.stock) - Number(b.stock)
  );

  const outOfStock = sorted.filter(
    (i) => getStockStatus(i.stock) === "Out of Stock"
  ).length;

  const lowStock = sorted.filter(
    (i) => getStockStatus(i.stock) === "Low Stock"
  ).length;

  const inStock = sorted.filter(
    (i) => getStockStatus(i.stock) === "In Stock"
  ).length;

  const highStock = sorted.filter(
    (i) => getStockStatus(i.stock) === "High Stock"
  ).length;
  const getStatusClass = (stock) => {
  const status = getStockStatus(stock);

  switch (status) {
    case "Out of Stock":
      return "bg-red-100 text-red-700";

    case "Low Stock":
      return "bg-yellow-100 text-yellow-700";

    case "In Stock":
      return "bg-blue-100 text-blue-700";

    case "High Stock":
      return "bg-green-100 text-green-700";

    default:
      return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Inventory Report
        </h1>
        <p className="text-slate-500">
          Items arranged by stock level.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex gap-3">
        <input
          type="text"
          placeholder="Search item, SKU, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2"
        />

        <button
          onClick={() => setPreview(true)}
          disabled={sorted.length === 0}
          className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300"
        >
          Print Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-xl">
          <p className="text-sm text-red-600">Out of Stock</p>
          <h2 className="text-2xl font-bold">{outOfStock}</h2>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl">
          <p className="text-sm text-yellow-700">Low Stock</p>
          <h2 className="text-2xl font-bold">{lowStock}</h2>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-sm text-blue-700">In Stock</p>
          <h2 className="text-2xl font-bold">{inStock}</h2>
        </div>

        <div className="bg-green-50 p-4 rounded-xl">
          <p className="text-sm text-green-700">High Stock</p>
          <h2 className="text-2xl font-bold">{highStock}</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-green-50 text-green-800">
            <tr>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-center">Stock</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-5 text-center text-slate-500">
                  No inventory items found.
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr
                    key={item.id}
                    className={`border-t ${
                      getStockStatus(item.stock) === "Out of Stock"
                        ? "bg-red-50"
                        : getStockStatus(item.stock) === "Low Stock"
                        ? "bg-yellow-50"
                        : getStockStatus(item.stock) === "In Stock"
                        ? "bg-blue-50"
                        : "bg-green-50"
                    }`}
                  >
                  <td className="p-3">{item.sku}</td>
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3 text-center">{item.stock}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                        item.stock
                      )}`}
                    >
                      {getStockStatus(item.stock)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6">
            <div id="print-area">
              <h2 className="text-center text-xl font-bold">
                Clarita's Mini Grocery
              </h2>

              <p className="text-center text-slate-500">
                Inventory Report
              </p>

              <p className="text-center text-slate-500 text-sm">
                Date Printed: {new Date().toLocaleString("en-PH")}
              </p>

              <hr className="my-4" />

              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border p-2 text-left">SKU</th>
                    <th className="border p-2 text-left">Item</th>
                    <th className="border p-2 text-left">Category</th>
                    <th className="border p-2 text-center">Stock</th>
                    <th className="border p-2 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {sorted.map((item) => (
                    <tr key={item.id}>
                      <td className="border p-2">{item.sku}</td>
                      <td className="border p-2">{item.name}</td>
                      <td className="border p-2">{item.category}</td>
                      <td className="border p-2 text-center">{item.stock}</td>
                      <td className="border p-2 text-center">
                        {getStockStatus(item.stock)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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