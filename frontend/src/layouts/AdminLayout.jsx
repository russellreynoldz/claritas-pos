import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Icon from "../components/Icon";
import GenericPage from "../components/GenericPage";
import { IC } from "../data/icons";
import { PAGE_MAP } from "../routes/pageMap";

export default function AdminLayout({ username }) {
  const [active, setActive]         = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const PageComponent = PAGE_MAP[active] || (()=><GenericPage title="Page" subtitle="" icon="file"/>);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen}/>
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800">
              <Icon d={IC.menu} size={22}/>
            </button>
           
          </div>
          <div className="flex items-center gap-3">
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-slate-700">{username}</span>
            </div>
          </div>
        </header>
        <main className={`flex-1 ${active==="sales"?"p-4":"p-4 sm:p-6"}`}>
          <PageComponent/>
        </main>
      </div>
    </div>
  );
}
