import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { IC } from "../data/icons";
import { fmt } from "../utils/format";
import { apiRequest } from "../services/api";

export default function SalesPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discType, setDiscType] = useState("percent");
  const [cash, setCash] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [receipt, setReceipt] = useState(null);
  const [customer, setCustomer] = useState("");
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
    return items.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.status === "Active" &&
        (
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
        )
      );
    });
  }, [items, search]);

  const addToCart = (p) => {
    if (Number(p.stock) <= 0) return;

    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);

      if (ex) {
        if (ex.qty >= Number(p.stock)) return prev;
        return prev.map((i) =>
          i.id === p.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...p, price: Number(p.price), stock: Number(p.stock), qty: 1 }];
    });
  };

  const updateQty = (id, d) =>
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, qty: Math.max(0, Math.min(i.qty + d, Number(i.stock))) }
            : i
        )
        .filter((i) => i.qty > 0)
    );

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const discAmt =
    discType === "percent"
      ? subtotal * (Number(discount) / 100)
      : Math.min(Number(discount) || 0, subtotal);
  const afterDisc = Math.max(0, subtotal - discAmt);
  const taxAmt = afterDisc;
  const grandTotal = afterDisc;
  const cashAmt = Number(cash) || 0;
  const change = Math.max(0, cashAmt - grandTotal);
  const canCharge = cart.length > 0 && (payMethod !== "cash" || cashAmt >= grandTotal);

 const handleCharge = async () => {
  try {
    const txId = "#TX-" + String(Math.floor(Math.random() * 9000) + 1000);

    const payload = {
      txId,
      customer: customer || "Walk-in",
      paymentMethod: payMethod,
      subtotal,
      discount: discAmt,
      total: grandTotal,
      cash: cashAmt,
      change,
      items: cart,
    };

    await apiRequest("/sales", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setReceipt({
      txId,
      items: [...cart],
      subtotal,
      discAmt,
      grandTotal,
      cash: cashAmt,
      change,
      payMethod,
      customer: customer || "Walk-in",
      date: new Date().toLocaleString("en-PH"),
    });

    setCart([]);
    setCash("");
    setDiscount(0);
    setCustomer("");

    loadItems(); // refresh stock after sale
  } catch (err) {
    alert(err.message);
  }
};

  if (receipt) {
    return (
      <div className="flex justify-center">
        <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-6 py-5 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <Icon d={IC.check} size={24} className="text-white" />
            </div>
            <h2 className="font-bold text-lg">Payment Successful</h2>
            <p className="text-emerald-100 text-sm mt-0.5">{receipt.txId}</p>
            <p className="text-emerald-100 text-xs mt-1">{receipt.date}</p>
          </div>

          <div className="px-6 py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Customer</span>
              <span className="font-semibold text-slate-700">{receipt.customer}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Payment</span>
              <span className="font-semibold text-slate-700 capitalize">{receipt.payMethod}</span>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-2 space-y-1.5">
              {receipt.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="flex-1 text-slate-600 truncate">{item.name}</span>
                  <span className="text-slate-400 text-xs">×{item.qty}</span>
                  <span className="font-semibold text-slate-700">
                    {fmt(Number(item.price) * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-2 space-y-1">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Subtotal</span>
                <span>{fmt(receipt.subtotal)}</span>
              </div>

              {receipt.discAmt > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs">
                  <span>Discount</span>
                  <span>-{fmt(receipt.discAmt)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 text-xs">
                <span>VAT (12%)</span>
                <span>{fmt(receipt.taxAmt)}</span>
              </div>

              <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-2">
                <span>Total</span>
                <span className="text-emerald-600">{fmt(receipt.grandTotal)}</span>
              </div>

              {receipt.payMethod === "cash" && (
                <>
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Cash</span>
                    <span>{fmt(receipt.cash)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 text-sm">
                    <span>Change</span>
                    <span>{fmt(receipt.change)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-5">
            <button className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50">
              <Icon d={IC.printer} size={14} /> Print
            </button>

            <button
              onClick={() => setReceipt(null)}
              className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
            >
              <Icon d={IC.plus} size={14} /> New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 112px)" }}>
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Icon
              d={IC.search}
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item, SKU, or category…"
              className="w-full h-9 pl-9 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 sticky top-0 z-10">
              <tr className="text-xs text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">SKU</th>
                <th className="px-5 py-3 text-left font-semibold">Item</th>
                <th className="px-5 py-3 text-left font-semibold">Category</th>
                <th className="px-5 py-3 text-left font-semibold">Price</th>
                <th className="px-5 py-3 text-left font-semibold">Stock</th>
                <th className="px-5 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading items...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const inCart = cart.find((i) => i.id === item.id);

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">
                        {item.sku}
                      </td>

                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {item.name}
                        {inCart && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            In cart: {inCart.qty}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-slate-500">{item.category}</td>

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
                        <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                      </td>

                      <td className="px-5 py-3">
                        <button
                          onClick={() => addToCart(item)}
                          disabled={Number(item.stock) <= 0}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-80 flex flex-col gap-3 shrink-0">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Customer
          </p>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Walk-in customer"
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">
              Order ({cart.reduce((s, i) => s + i.qty, 0)} items)
            </h3>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-400 hover:text-red-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-8">
              <Icon d={IC.bag} size={32} />
              <p className="mt-2 text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{fmt(Number(item.price))}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Icon d={IC.minus} size={11} />
                    </button>

                    <span className="w-6 text-center text-sm font-bold text-slate-700">
                      {item.qty}
                    </span>

                    <button
                      onClick={() => updateQty(item.id, 1)}
                      disabled={item.qty >= Number(item.stock)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30"
                    >
                      <Icon d={IC.plus} size={11} />
                    </button>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 ml-1"
                    >
                      <Icon d={IC.trash} size={11} />
                    </button>
                  </div>

                  <div className="w-14 text-right text-xs font-bold text-slate-800 shrink-0">
                    {fmt(Number(item.price) * item.qty)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icon d={IC.percent} size={13} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-semibold flex-1">
              Discount
            </span>

            <select
              value={discType}
              onChange={(e) => setDiscType(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-none"
            >
              <option value="percent">%</option>
              <option value="fixed">₱</option>
            </select>

            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-16 text-xs text-right border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="bg-slate-50 rounded-xl px-3 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">{fmt(subtotal)}</span>
            </div>

            {discAmt > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{fmt(discAmt)}</span>
              </div>
            )}


            <div className="flex justify-between font-bold text-slate-800 text-sm pt-1 border-t border-slate-200">
              <span>Total</span>
              <span className="text-emerald-600">{fmt(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["cash", "Cash", "cash"],
              ["card", "Card", "creditCard"],
              ["qr", "QR", "qr"],
            ].map(([k, lbl, ico]) => (
              <button
                key={k}
                onClick={() => setPayMethod(k)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                  payMethod === k
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-400 hover:border-slate-300"
                }`}
              >
                <Icon d={IC[ico]} size={15} />
                {lbl}
              </button>
            ))}
          </div>

          {payMethod === "cash" && (
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-1.5">
                Cash Tendered
              </p>

              <input
                type="number"
                min="0"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder={`Min. ${fmt(grandTotal)}`}
                className="w-full h-10 px-3 text-sm border-2 border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 font-bold"
              />

              {cashAmt >= grandTotal && cashAmt > 0 && (
                <div className="flex justify-between mt-1.5 text-sm font-bold text-emerald-600">
                  <span>Change</span>
                  <span>{fmt(change)}</span>
                </div>
              )}

              {cashAmt > 0 && cashAmt < grandTotal && (
                <p className="text-xs text-red-500 mt-1.5 font-semibold">
                  Short by {fmt(grandTotal - cashAmt)}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCharge}
            disabled={!canCharge}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon d={IC.check} size={17} />
            {payMethod === "cash"
              ? `Charge ${fmt(grandTotal)}`
              : `Process ${fmt(grandTotal)}`}
          </button>
        </div>
      </div>
    </div>
  );
}