export const INIT_USERS = [
  { id:1, username:"admin",    fullName:"Admin User",     role:"Administrator", status:"Active",   email:"admin@store.com"   },
  { id:2, username:"jdelacruz",fullName:"Juan Dela Cruz", role:"Cashier",       status:"Active",   email:"juan@store.com"    },
  { id:3, username:"mreyes",   fullName:"Maria Reyes",    role:"Inventory",     status:"Inactive", email:"maria@store.com"   },
  { id:4, username:"pgarcia",  fullName:"Pedro Garcia",   role:"Cashier",       status:"Active",   email:"pedro@store.com"   },
];

export const INIT_ITEMS = [
  { id:1,  name:"Ergonomic Chair Pro",   sku:"CHR-001", category:"Furniture",   price:3100, cost:1800, stock:24, unit:"pcs", status:"Active" },
  { id:2,  name:"Standing Desk 140cm",   sku:"DSK-002", category:"Furniture",   price:5800, cost:3200, stock:10, unit:"pcs", status:"Active" },
  { id:3,  name:'Monitor 27" 4K',        sku:"MON-003", category:"Electronics", price:9300, cost:6000, stock:15, unit:"pcs", status:"Active" },
  { id:4,  name:"Wireless Keyboard",     sku:"KBD-004", category:"Electronics", price:890,  cost:400,  stock:42, unit:"pcs", status:"Active" },
  { id:5,  name:"Ergonomic Mouse",       sku:"MSE-005", category:"Electronics", price:760,  cost:350,  stock:38, unit:"pcs", status:"Active" },
  { id:6,  name:"USB-C Hub 7-in-1",      sku:"HUB-006", category:"Electronics", price:1200, cost:700,  stock:29, unit:"pcs", status:"Active" },
  { id:7,  name:"Laptop Stand",          sku:"STD-007", category:"Accessories", price:1450, cost:800,  stock:17, unit:"pcs", status:"Active" },
  { id:8,  name:"Desk Lamp LED",         sku:"LMP-009", category:"Lighting",    price:650,  cost:300,  stock:20, unit:"pcs", status:"Inactive"},
];

export const DASH_STATS = [
  { label:"Total Sales",     value:"₱284,500", change:"+12.4%", up:true,  icon:"bag",      grad:"from-emerald-500 to-teal-600"    },
  { label:"Inventory Items", value:"1,243",    change:"+3.1%",  up:true,  icon:"box",      grad:"from-cyan-500 to-emerald-600"    },
  { label:"Purchase Orders", value:"38",       change:"-2",     up:false, icon:"receipt",  grad:"from-amber-400 to-orange-500"    },
  { label:"Net Profit",      value:"₱91,200",  change:"+8.7%",  up:true,  icon:"trending", grad:"from-green-400 to-emerald-600"   },
];

export const RECENT_TX = [
  { id:"#TX-0091", type:"Sale",     item:"Office Chair Pro",  qty:4,  amount:"₱12,400", status:"Completed", date:"Jun 3" },
  { id:"#TX-0090", type:"Purchase", item:"Standing Desk",     qty:10, amount:"₱58,000", status:"Pending",   date:"Jun 3" },
  { id:"#TX-0089", type:"Sale",     item:'Monitor 27"',       qty:2,  amount:"₱18,600", status:"Completed", date:"Jun 2" },
  { id:"#TX-0088", type:"Adjust",   item:"Keyboard Wireless", qty:-3, amount:"—",        status:"Done",      date:"Jun 2" },
  { id:"#TX-0087", type:"Sale",     item:"Ergonomic Mouse",   qty:7,  amount:"₱6,300",  status:"Completed", date:"Jun 1" },
];
