export const NAV = [
  { key: "dashboard",    label: "Dashboard",    icon: "home" },
  { key: "masterfile",   label: "Masterfile",   icon: "file", children: [
    { key: "mf-users",      label: "Users",      icon: "users"    },
    { key: "mf-customers", label: "Customers", icon: "users" },
    { key: "mf-items",      label: "Items",      icon: "box"      },
   // { key: "mf-categories", label: "Categories", icon: "tag"      },//
    //{ key: "mf-suppliers",  label: "Suppliers",  icon: "userCheck"},//
    //{ key: "mf-warehouse",  label: "Warehouse",  icon: "warehouse"},//
  ]},
  { key: "transactions", label: "Transactions", icon: "receipt", children: [
    { key: "tx-purchase",   label: "Purchase Orders", icon: "cart"    },
    { key: "tx-receive",    label: "Receive Items",   icon: "package" },
    { key: "tx-adjust",     label: "Inventory Adjustments",     icon: "sliders" },
  ]},
  { key: "inventory",    label: "Inventory",    icon: "layers", children: [
    { key: "inv-stock",     label: "Stock",  icon: "barChart" },
    //{ key: "inv-movement",  label: "Movement Log",  icon: "trending" },//
    //{ key: "inv-valuation", label: "Valuation",     icon: "dollar"   },//
  ]},
  {
      key: "sales",
      label: "Sales",
      icon: "bag",
      children: [
        { key: "sales-checkout", label: "Checkout", icon: "cash" },
        { key: "sales-credit", label: "Credit", icon: "creditCard" },
        { key: "sales-return", label: "Return Item", icon: "package" },
        { key: "sales-payment", label: "Payment", icon: "wallet" },
        { key: "checkout-history", label: "Checkout History", icon: "layers" },
      ],
  },
  { key: "reports",      label: "Reports",      icon: "pieChart", children: [
    { key: "rpt-sales", label: "Sales Report", icon: "barChart" },
    { key: "rpt-daily-sales", label: "Daily Sales", icon: "bag" },
    { key: "rpt-weekly-sales", label: "Weekly Sales", icon: "trending" },
    { key: "rpt-monthly-sales", label: "Monthly Sales", icon: "barChart" },
    { key: "rpt-inventory", label: "Inventory Report", icon: "layers" },
    { key: "rpt-profit", label: "Profit & Loss", icon: "dollar" },
  ]},
];
