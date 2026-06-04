import Icon from "../components/Icon";
import { IC } from "../data/icons";
import { DASH_STATS, RECENT_TX } from "../data/sampleData";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, Admin! Here's your overview.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {DASH_STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <span className={`text-xs font-semibold mt-1 inline-block ${s.up?"text-emerald-600":"text-red-500"}`}>
                {s.change} <span className="text-slate-400 font-normal">vs last month</span>
              </span>
            </div>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md`}>
              <Icon d={IC[s.icon]} size={18} className="text-white"/>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Transactions</h2>
          <span className="text-xs text-emerald-600 font-semibold cursor-pointer hover:underline">View all</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/70">
                {["ID","Type","Item","Qty","Amount","Date","Status"].map(h=>(
                  <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {RECENT_TX.map(tx => (
                <tr key={tx.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{tx.id}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${tx.type==="Sale"?"bg-emerald-50 text-emerald-700":tx.type==="Purchase"?"bg-amber-50 text-amber-600":"bg-slate-100 text-slate-500"}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-700">{tx.item}</td>
                  <td className="px-6 py-3 text-slate-600">{tx.qty}</td>
                  <td className="px-6 py-3 font-semibold text-slate-700">{tx.amount}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs">{tx.date}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tx.status==="Pending"?"bg-amber-100 text-amber-700":tx.status==="Done"?"bg-blue-100 text-blue-700":"bg-emerald-100 text-emerald-700"}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
