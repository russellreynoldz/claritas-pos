import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function CreditPage() {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanCode, setScanCode] = useState("");

  const [qtyModal, setQtyModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [manualQty, setManualQty] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const customerData = await apiRequest("/customers");
    const itemData = await apiRequest("/items");

    setCustomers(Array.isArray(customerData) ? customerData : []);
    setItems(Array.isArray(itemData) ? itemData : []);
  };

  const customerSuggestions = useMemo(() => {
    const q = customerSearch.toLowerCase();

    if (!q) return [];

    return customers.filter(
      (c) =>
        c.status !== "Inactive" &&
        (c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();

    return items.filter(
      (item) =>
        item.status === "Active" &&
        (item.name?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q))
    );
  }, [items, search]);

  const addToCart = (item) => {
    if (!selectedCustomer) {
      alert("Please select customer first.");
      return;
    }

    if (Number(item.stock) <= 0) return;

    setCart((prev) => {
      const existing = prev.find((x) => x.id === item.id);

      if (existing) {
        if (existing.qty >= Number(item.stock)) return prev;

        return prev.map((x) =>
          x.id === item.id ? { ...x, qty: x.qty + 1 } : x
        );
      }

      return [
        ...prev,
        {
          ...item,
          price: Number(item.price),
          stock: Number(item.stock),
          qty: 1,
        },
      ];
    });
  };

  const handleScan = (e) => {
    if (e.key !== "Enter") return;

    if (!selectedCustomer) {
      alert("Please select customer first.");
      setScanCode("");
      return;
    }

    const code = scanCode.trim();
    if (!code) return;

    const found = items.find(
      (item) =>
        String(item.sku) === code ||
        String(item.barcode) === code ||
        String(item.qr_code) === code
    );

    if (!found) {
      alert("Item not found: " + code);
      setScanCode("");
      return;
    }

    addToCart(found);
    setScanCode("");
  };

  const updateQty = (id, change) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: Math.max(
                  0,
                  Math.min(item.qty + change, Number(item.stock))
                ),
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const openQtyModal = (item) => {
    setSelectedItem(item);
    setManualQty(item.qty);
    setQtyModal(true);
  };

  const confirmManualQty = () => {
    if (!selectedItem) return;

    const qty = Math.max(
      1,
      Math.min(Number(manualQty) || 1, Number(selectedItem.stock))
    );

    setCart((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id ? { ...item, qty } : item
      )
    );

    setQtyModal(false);
    setSelectedItem(null);
    setManualQty(1);
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0
  );

  const canSave = selectedCustomer && cart.length > 0 && !saving;

  const saveCredit = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      const creditNo =
        "#CR-" + String(Math.floor(Math.random() * 9000) + 1000);

      await apiRequest("/credit-sales", {
        method: "POST",
        body: JSON.stringify({
          creditNo,
          customer: selectedCustomer,
          total,
          items: cart,
        }),
      });

      alert("Credit transaction saved.");

      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setSearch("");
      setScanCode("");

      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 112px)" }}>
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-w-0 overflow-hidden">
        <div className="flex gap-3 p-4 border-b border-slate-100">
          <input
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={handleScan}
            placeholder="Scan barcode / QR code..."
            className="w-72 h-9 px-3 text-sm bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            autoFocus
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item..."
            className="flex-1 h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {!selectedCustomer && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-amber-700 text-sm font-semibold">
            Please select a customer first before adding items to credit.
          </div>
        )}

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
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const inCart = cart.find((x) => x.id === item.id);

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
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!selectedCustomer || Number(item.stock) <= 0}
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
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 relative">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Customer
          </p>

          <input
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setSelectedCustomer(null);
              setShowCustomerList(true);
            }}
            onFocus={() => setShowCustomerList(true)}
            placeholder="Type customer name first"
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />

          {showCustomerList && customerSearch && (
            <div className="absolute left-4 right-4 top-[76px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {customerSuggestions.length > 0 ? (
                customerSuggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerSearch(customer.name);
                      setShowCustomerList(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50"
                  >
                    <p className="font-semibold text-slate-700">
                      {customer.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {customer.phone || "No phone"}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-slate-400">
                  No customer found.
                </div>
              )}
            </div>
          )}

          {!selectedCustomer && (
            <p className="text-xs text-red-500 mt-2">
              Select customer first before adding items.
            </p>
          )}
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">
              Credit Order ({cart.reduce((sum, item) => sum + item.qty, 0)} items)
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
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {fmt(Number(item.price))}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    >
                      <Icon d={IC.minus} size={11} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openQtyModal(item)}
                      className="w-8 h-7 text-center text-sm font-bold text-slate-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                    >
                      {item.qty}
                    </button>

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
          <div className="bg-slate-50 rounded-xl px-3 py-3 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-slate-800 text-sm">
              <span>Total</span>
              <span className="text-emerald-600">{fmt(total)}</span>
            </div>
          </div>

          <button
            onClick={saveCredit}
            disabled={!canSave}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon d={IC.check} size={17} />
            {saving ? "Saving..." : "Save Credit"}
          </button>
        </div>
      </div>

      {qtyModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Edit Quantity
            </h2>

            <p className="text-sm text-slate-500 mb-4">
              {selectedItem.name} — Stock: {selectedItem.stock}
            </p>

            <input
              type="number"
              min="1"
              max={selectedItem.stock}
              value={manualQty}
              onChange={(e) => setManualQty(e.target.value)}
              className="w-full h-11 px-3 border rounded-xl text-center font-bold outline-none focus:border-emerald-500"
              autoFocus
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setQtyModal(false)}
                className="flex-1 h-10 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={confirmManualQty}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}