export default function FormField({ label, name, value, onChange, type = "text", options, placeholder, span = 1 }) {
  return (
    <div className={span === 2 ? "col-span-2 mb-4" : "mb-4"}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
      {options ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          placeholder={placeholder || label}
        />
      )}
    </div>
  );
}
