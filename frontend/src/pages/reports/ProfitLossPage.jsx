import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import { IC } from "../../data/icons";
import { apiRequest } from "../../services/api";
import { fmt } from "../../utils/format";

export default function ProfitLossPage() {
  const [report, setReport] = useState({
    gross_sales: 0,
    cost_of_goods: 0,
    gross_profit: 0,
    total_discount: 0,
    net_profit: 0,
  });

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    const data = await apiRequest("/reports/profit-loss");
    setReport(data);
  };

  const cards = [
    {
      label: "Gross Sales",
      value: fmt(Number(report.gross_sales)),
      icon: "bag",
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Cost of Goods",
      value: fmt(Number(report.cost_of_goods)),
      icon: "box",
      color: "from-orange-400 to-red-500",
    },
    {
      label: "Gross Profit",
      value: fmt(Number(report.gross_profit)),
      icon: "trending",
      color: "from-cyan-500 to-emerald-600",
    },
    {
      label: "Total Discount",
      value: fmt(Number(report.total_discount)),
      icon: "percent",
      color: "from-amber-400 to-orange-500",
    },
    {
      label: "Net Profit",
      value: fmt(Number(report.net_profit)),
      icon: "dollar",
      color: "from-green-500 to-emerald-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Profit & Loss
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          View sales income, cost of goods, and net profit.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start justify-between"
          >
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-xl font-bold text-slate-800">
                {card.value}
              </p>
            </div>

            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}
            >
              <Icon d={IC[card.icon]} size={18} className="text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Profit & Loss Summary</h2>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Gross Sales</span>
            <span className="font-bold text-emerald-700">
              {fmt(Number(report.gross_sales))}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Less: Cost of Goods Sold</span>
            <span className="font-bold text-red-500">
              -{fmt(Number(report.cost_of_goods))}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Gross Profit</span>
            <span className="font-bold text-slate-800">
              {fmt(Number(report.gross_profit))}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Less: Discounts</span>
            <span className="font-bold text-amber-600">
              -{fmt(Number(report.total_discount))}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-base font-bold text-slate-800">
              Net Profit
            </span>
            <span className="text-base font-bold text-emerald-700">
              {fmt(Number(report.net_profit))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}