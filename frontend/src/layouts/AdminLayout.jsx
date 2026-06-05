import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import GenericPage from "../components/GenericPage";
import { IC } from "../data/icons";
import { PAGE_MAP } from "../routes/pageMap";
import { apiRequest } from "../services/api";

export default function AdminLayout({ username, role, onLogout }) {
  const userRole = String(role || "administrator").toLowerCase();

  const defaultPage =
    userRole === "cashier"
      ? "sales-checkout"
      : userRole === "inventory"
      ? "mf-items"
      : "dashboard";

  const [active, setActive] = useState(defaultPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);

  const PageComponent =
    PAGE_MAP[active] ||
    (() => <GenericPage title="Page" subtitle="" icon="file" />);

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    try {
      const data = await apiRequest("/notifications/low-stock");
      setLowStockItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Low stock notification error:", err);
      setLowStockItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        role={role}
        username={username}
        onLogout={onLogout}
      />

      <div className="lg:pl-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800"
            >
              <Icon d={IC.menu} size={22} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setUserOpen(false);
                  loadLowStock();
                }}
                className="relative text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Icon d={IC.bell} size={20} />

                {lowStockItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Low Stock Notifications
                    </h3>
                    <p className="text-xs text-slate-400">
                      Items below 5 quantity
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {lowStockItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        No low stock items.
                      </div>
                    ) : (
                      lowStockItems.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-3 border-b border-slate-50 hover:bg-red-50/40"
                        >
                          <p className="text-sm font-semibold text-slate-800">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            SKU: {item.sku}
                          </p>
                          <p className="text-xs font-bold text-red-500 mt-1">
                            Remaining: {item.stock} {item.unit}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-2 py-1 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow">
                  {String(username || "U").charAt(0).toUpperCase()}
                </div>

                <span className="hidden sm:block text-sm font-semibold text-slate-700">
                  {username}
                </span>

                <Icon d={IC.chevDown} size={13} className="text-slate-400" />
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">
                      {username}
                    </p>
                    <p className="text-xs text-slate-400">{role}</p>
                  </div>

                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 font-semibold flex items-center gap-2"
                  >
                    <Icon d={IC.logout} size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={`flex-1 ${
            active === "sales" ? "p-4" : "p-4 sm:p-6"
          }`}
        >
          <PageComponent />
        </main>
      </div>
    </div>
  );
}