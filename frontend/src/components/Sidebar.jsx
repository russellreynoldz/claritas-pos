import { useState } from "react";
import Icon from "./Icon";
import { IC } from "../data/icons";
import { NAV } from "../data/nav";

export default function Sidebar({ active, setActive, open, setOpen, role }) {
  const [expanded, setExpanded] = useState({ masterfile: true });
  const toggle = k => setExpanded(p => ({...p, [k]: !p[k]}));
  const userRole = String(role || "administrator").toLowerCase();
  console.log("Role =", role);
  console.log("UserRole =", userRole);
  const allowedByRole = {
      administrator: ["dashboard", "masterfile", "transactions", "inventory", "sales", "reports"],
      admin: ["dashboard", "masterfile", "transactions", "inventory", "sales", "reports"],
      cashier: ["sales", "reports"],
      inventory: ["masterfile", "transactions", "inventory"],
  };


    const allowedChildrenByRole = {
      administrator: "all",
      admin: "all",
      cashier: [
                "sales-checkout",
                "sales-credit",
                "sales-return",
                "sales-payment",
                "checkout-history",
                "rpt-daily-sales",
              ],
      inventory: ["mf-items", "tx-purchase", "tx-receive", "tx-adjust", "inv-stock", "inv-movement", "inv-valuation"],
  };

    const filteredNav = NAV
      .filter((item) => allowedByRole[userRole]?.includes(item.key))
      .map((item) => {
        if (!item.children) return item;

        if (allowedChildrenByRole[userRole] === "all") return item;

        return {
          ...item,
          children: item.children.filter((child) =>
            allowedChildrenByRole[userRole]?.includes(child.key)
          ),
        };
  });

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={()=>setOpen(false)}/>}
      <aside className={`fixed top-0 left-0 h-screen w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-30 transition-transform duration-300 ${open?"translate-x-0":"-translate-x-full"} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
           <img
                src="/cart.png"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
           
            <span className="text-white font-bold text-sm tracking-tight">Clarita's Mini Grocery</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={()=>setOpen(false)}>
            <Icon d={IC.close} size={18}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {filteredNav.map(item => {
            const hasKids = item.children?.length > 0;
            const isExp   = expanded[item.key];
            const isActive = active === item.key || item.children?.some(c=>c.key===active);
            return (
              <div key={item.key}>
                <button
                  onClick={()=>{ if(hasKids) toggle(item.key); else { setActive(item.key); setOpen(false); }}}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all
                    ${isActive&&!hasKids
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                      : isActive
                      ? "bg-slate-800 text-emerald-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                  <span className="flex items-center gap-2.5">
                    <Icon d={IC[item.icon]} size={15}/>
                    {item.label}
                  </span>
                  {hasKids && (
                    <Icon d={IC.chevDown} size={13}
                      className={`transition-transform duration-200 ${isExp?"rotate-180":""}`}/>
                  )}
                </button>
                {hasKids && isExp && (
                  <div className="ml-4 mt-0.5 border-l border-slate-700/70 pl-3 space-y-0.5 pb-1">
                    {item.children.map(child => (
                      <button key={child.key}
                        onClick={()=>{ setActive(child.key); setOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all font-medium
                          ${active===child.key
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                            : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"}`}>
                        <Icon d={IC[child.icon]} size={13}/>
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-md">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Admin User</p>
              <p className="text-slate-500 text-xs truncate">Administrator</p>
            </div>
            <button title="Logout" className="text-slate-500 hover:text-red-400 transition-colors">
              <Icon d={IC.logout} size={15}/>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
