import Icon from "./Icon";
import { IC } from "../data/icons";

export default function GenericPage({ title, subtitle, icon }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-14 flex flex-col items-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <Icon d={IC[icon] || IC.file} size={28} className="text-emerald-500"/>
        </div>
        <h3 className="font-bold text-slate-700 text-lg mb-1">{title}</h3>
        <p className="text-slate-400 text-sm max-w-xs">Content for <strong>{title}</strong> will appear here.</p>
        <button className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-emerald-200">
          Get Started
        </button>
      </div>
    </div>
  );
}
