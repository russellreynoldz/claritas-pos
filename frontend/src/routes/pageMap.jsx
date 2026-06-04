import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/masterfile/UsersPage";
import ItemsPage from "../pages/masterfile/ItemsPage";
import CategoriesPage from "../pages/masterfile/CategoriesPage";
import SuppliersPage from "../pages/masterfile/SuppliersPage";
import WarehousePage from "../pages/masterfile/WarehousePage";
import PurchaseOrdersPage from "../pages/transactions/PurchaseOrdersPage";
import ReceiveItemsPage from "../pages/transactions/ReceiveItemsPage";
import AdjustmentsPage from "../pages/transactions/AdjustmentsPage";
import StockLevelsPage from "../pages/inventory/StockLevelsPage";
import MovementLogPage from "../pages/inventory/MovementLogPage";
import ValuationPage from "../pages/inventory/ValuationPage";
import SalesPage from "../pages/SalesPage";
import SalesReportPage from "../pages/reports/SalesReportPage";
import InventoryReportPage from "../pages/reports/InventoryReportPage";
import ProfitLossPage from "../pages/reports/ProfitLossPage";


export const PAGE_MAP = {
  dashboard: DashboardPage,
  "mf-users": UsersPage,
  "mf-items": ItemsPage,
  "mf-categories": CategoriesPage,
  "mf-suppliers": SuppliersPage,
  "mf-warehouse": WarehousePage,
  "tx-purchase": PurchaseOrdersPage,
  "tx-receive": ReceiveItemsPage,
  "tx-adjust": AdjustmentsPage,
  "inv-stock": StockLevelsPage,
  "inv-movement": MovementLogPage,
  "inv-valuation": ValuationPage,
  sales: SalesPage,
  "rpt-sales": SalesReportPage,
  "rpt-inventory": InventoryReportPage,
  "rpt-profit": ProfitLossPage,
  "inv-stock": () => <StockLevelsPage />,
  "rpt-sales": () => <SalesReportPage />,
  "rpt-profit": () => <ProfitLossPage />,
};
