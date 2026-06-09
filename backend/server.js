import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
//app.use(cors());//

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-vercel-app.vercel.app"
  ],
  credentials: true
}));


app.use(express.json());

const db = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "claritas_pos",
  waitForConnections: true,
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND status = 'Active' LIMIT 1",
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, username, fullName, email, role, status FROM users ORDER BY id DESC"
  );
  res.json(rows);
});

app.post("/api/users", async (req, res) => {
  try {
    const { username, password, fullName, email, role, status } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (username, password, fullName, email, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashed, fullName, email, role, status]
    );
    res.status(201).json({ id: result.insertId, username, fullName, email, role, status });
  } catch (err) {
    res.status(400).json({ error: err.code === "ER_DUP_ENTRY" ? "Username already exists" : err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { username, password, fullName, email, role, status } = req.body;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET username=?, password=?, fullName=?, email=?, role=?, status=? WHERE id=?",
        [username, hashed, fullName, email, role, status, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE users SET username=?, fullName=?, email=?, role=?, status=? WHERE id=?",
        [username, fullName, email, role, status, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.code === "ER_DUP_ENTRY" ? "Username already exists" : err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  await db.query("DELETE FROM users WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

app.get("/api/items", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM items ORDER BY id DESC");
  res.json(rows.map(r => ({ ...r, price: Number(r.price), cost: Number(r.cost) })));
});

app.post("/api/items", async (req, res) => {
  try {
    const { name, sku, category, price, cost, stock, unit, status } = req.body;
    const [result] = await db.query(
      "INSERT INTO items (name, sku, category, price, cost, stock, unit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, sku, category, price, cost, stock, unit, status]
    );
    res.status(201).json({ id: result.insertId, name, sku, category, price, cost, stock, unit, status });
  } catch (err) {
    res.status(400).json({ error: err.code === "ER_DUP_ENTRY" ? "SKU already exists" : err.message });
  }
});

app.put("/api/items/:id", async (req, res) => {
  try {
    const { name, sku, category, price, cost, stock, unit, status } = req.body;
    await db.query(
      "UPDATE items SET name=?, sku=?, category=?, price=?, cost=?, stock=?, unit=?, status=? WHERE id=?",
      [name, sku, category, price, cost, stock, unit, status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.code === "ER_DUP_ENTRY" ? "SKU already exists" : err.message });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  await db.query("DELETE FROM items WHERE id=?", [req.params.id]);
  res.json({ success: true });
});
app.get("/", (req, res) => {
  res.send("Backend server is running");
});
const port = process.env.PORT || 5000;

// ================= PURCHASE ORDERS =================

app.get("/api/purchase-orders", async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT * FROM purchase_orders
      ORDER BY id DESC
    `);

    res.json(orders);
  } catch (err) {
    console.error("GET PO ERROR:", err);
    res.status(500).json({ message: "Failed to load purchase orders" });
  }
});

app.get("/api/purchase-orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[order]] = await db.query(
      "SELECT * FROM purchase_orders WHERE id = ?",
      [id]
    );

    if (!order) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const [items] = await db.query(
      "SELECT * FROM purchase_order_items WHERE po_id = ?",
      [id]
    );

    res.json({ ...order, items });
  } catch (err) {
    console.error("GET PO DETAIL ERROR:", err);
    res.status(500).json({ message: "Failed to load purchase order" });
  }
});

app.post("/api/purchase-orders", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      supplier_id,
      supplier_name,
      order_date,
      expected_date,
      notes,
      items,
    } = req.body;

    if (!supplier_id || !supplier_name) {
      return res.status(400).json({ message: "Supplier is required" });
    }

    if (!items || !items.length) {
      return res.status(400).json({ message: "Add at least one item" });
    }

    await conn.beginTransaction();

    const po_no = "PO-" + Date.now();

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.qty) * Number(item.cost),
      0
    );

    const [poResult] = await conn.query(
      `
      INSERT INTO purchase_orders
      (po_no, supplier_id, supplier_name, order_date, expected_date, status, subtotal, notes)
      VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)
      `,
      [
        po_no,
        supplier_id,
        supplier_name,
        order_date,
        expected_date || null,
        subtotal,
        notes || "",
      ]
    );

    const poId = poResult.insertId;

    for (const item of items) {
      await conn.query(
        `
        INSERT INTO purchase_order_items
        (po_id, item_id, item_name, qty, cost, total)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          poId,
          item.item_id,
          item.item_name,
          item.qty,
          item.cost,
          Number(item.qty) * Number(item.cost),
        ]
      );
    }

    await conn.commit();

    res.json({
      message: "Purchase order created successfully",
      id: poId,
      po_no,
    });
  } catch (err) {
    await conn.rollback();
    console.error("CREATE PO ERROR:", err);
    res.status(500).json({ message: "Failed to create purchase order" });
  } finally {
    conn.release();
  }
});

app.put("/api/purchase-orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query(
      "UPDATE purchase_orders SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("UPDATE PO STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

app.delete("/api/purchase-orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM purchase_orders WHERE id = ?", [id]);

    res.json({ message: "Purchase order deleted successfully" });
  } catch (err) {
    console.error("DELETE PO ERROR:", err);
    res.status(500).json({ message: "Failed to delete purchase order" });
  }
});

// ================= SUPPLIERS =================

app.get("/api/suppliers", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, contact_person, phone, address, status
      FROM suppliers
      WHERE status = 'Active'
      ORDER BY name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET SUPPLIERS ERROR:", err);
    res.status(500).json({ message: "Failed to load suppliers" });
  }
});

// ================= RECEIVING =================

app.get("/api/receivings", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM receive_orders
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET RECEIVINGS ERROR:", err);
    res.status(500).json({ message: "Failed to load receivings" });
  }
});

app.get("/api/receivings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [[receive]] = await db.query(
      "SELECT * FROM receive_orders WHERE id = ?",
      [id]
    );

    if (!receive) {
      return res.status(404).json({ message: "Receiving not found" });
    }

    const [items] = await db.query(
      "SELECT * FROM receive_order_items WHERE receive_id = ?",
      [id]
    );

    res.json({ ...receive, items });
  } catch (err) {
    console.error("GET RECEIVING DETAIL ERROR:", err);
    res.status(500).json({ message: "Failed to load receiving details" });
  }
});

app.get("/api/purchase-orders/:id/receiving-items", async (req, res) => {
  try {
    const { id } = req.params;

    const [[po]] = await db.query(
      "SELECT * FROM purchase_orders WHERE id = ?",
      [id]
    );

    if (!po) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const [items] = await db.query(
      `
      SELECT 
        poi.id,
        poi.po_id,
        poi.item_id,
        poi.item_name,
        poi.qty AS ordered_qty,
        poi.cost,
        poi.total,
        COALESCE(SUM(roi.qty_received), 0) AS received_qty,
        poi.qty - COALESCE(SUM(roi.qty_received), 0) AS remaining_qty
      FROM purchase_order_items poi
      LEFT JOIN receive_order_items roi 
        ON roi.item_id = poi.item_id
      LEFT JOIN receive_orders ro 
        ON ro.id = roi.receive_id 
        AND ro.po_id = poi.po_id
      WHERE poi.po_id = ?
      GROUP BY poi.id
      `,
      [id]
    );

    res.json({
      po,
      items,
    });
  } catch (err) {
    console.error("GET PO RECEIVING ITEMS ERROR:", err);
    res.status(500).json({ message: "Failed to load PO items" });
  }
});

app.post("/api/receivings", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      po_id,
      po_no,
      supplier_name,
      received_date,
      received_by,
      notes,
      items,
    } = req.body;

    if (!po_id) {
      return res.status(400).json({ message: "Purchase order is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items to receive" });
    }

    const validItems = items.filter((item) => Number(item.qty_received) > 0);

    if (validItems.length === 0) {
      return res.status(400).json({ message: "Enter received quantity" });
    }

    await conn.beginTransaction();

    for (const item of validItems) {
      const [[poItem]] = await conn.query(
        `
        SELECT qty 
        FROM purchase_order_items
        WHERE po_id = ? AND item_id = ?
        `,
        [po_id, item.item_id]
      );

      if (!poItem) {
        throw new Error(`${item.item_name} is not part of this purchase order`);
      }

      const [[receivedData]] = await conn.query(
        `
        SELECT COALESCE(SUM(roi.qty_received), 0) AS received_qty
        FROM receive_order_items roi
        JOIN receive_orders ro ON ro.id = roi.receive_id
        WHERE ro.po_id = ? AND roi.item_id = ?
        `,
        [po_id, item.item_id]
      );

      const alreadyReceived = Number(receivedData.received_qty || 0);
      const orderedQty = Number(poItem.qty || 0);
      const newReceived = Number(item.qty_received || 0);

      if (alreadyReceived + newReceived > orderedQty) {
        throw new Error(
          `${item.item_name} received quantity is greater than ordered quantity`
        );
      }
    }

    const receive_no = "RR-" + Date.now();

    const total = validItems.reduce(
      (sum, item) => sum + Number(item.qty_received) * Number(item.cost),
      0
    );

    const [receiveResult] = await conn.query(
      `
      INSERT INTO receive_orders
      (receive_no, po_id, po_no, supplier_name, received_date, received_by, notes, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        receive_no,
        po_id,
        po_no,
        supplier_name,
        received_date,
        received_by || "",
        notes || "",
        total,
      ]
    );

    const receiveId = receiveResult.insertId;

    for (const item of validItems) {
      const itemTotal = Number(item.qty_received) * Number(item.cost);

      await conn.query(
        `
        INSERT INTO receive_order_items
        (receive_id, item_id, item_name, qty_received, cost, total)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          receiveId,
          item.item_id,
          item.item_name,
          item.qty_received,
          item.cost,
          itemTotal,
        ]
      );

      await conn.query(
        `
        UPDATE items
        SET stock = stock + ?
        WHERE id = ?
        `,
        [item.qty_received, item.item_id]
      );
    }

    const [[remainingCheck]] = await conn.query(
      `
      SELECT COUNT(*) AS remaining_count
      FROM (
        SELECT 
          poi.item_id,
          poi.qty - COALESCE(SUM(roi.qty_received), 0) AS remaining_qty
        FROM purchase_order_items poi
        LEFT JOIN receive_order_items roi 
          ON roi.item_id = poi.item_id
        LEFT JOIN receive_orders ro 
          ON ro.id = roi.receive_id 
          AND ro.po_id = poi.po_id
        WHERE poi.po_id = ?
        GROUP BY poi.id
        HAVING remaining_qty > 0
      ) x
      `,
      [po_id]
    );

    if (Number(remainingCheck.remaining_count) === 0) {
      await conn.query(
        "UPDATE purchase_orders SET status = 'Received' WHERE id = ?",
        [po_id]
      );
    } else {
      await conn.query(
        "UPDATE purchase_orders SET status = 'Partial' WHERE id = ?",
        [po_id]
      );
    }

    await conn.commit();

    res.json({
      message: "Items received and inventory updated",
      receive_no,
      id: receiveId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("CREATE RECEIVING ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to save receiving",
    });
  } finally {
    conn.release();
  }
});

// ================= INVENTORY ADJUSTMENTS =================

app.get("/api/inventory-adjustments", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM inventory_adjustments
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("GET ADJUSTMENTS ERROR:", err);
    res.status(500).json({ message: "Failed to load inventory adjustments" });
  }
});

app.post("/api/inventory-adjustments", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      item_id,
      item_name,
      adjustment_type,
      quantity,
      reason,
      adjusted_by,
    } = req.body;

    if (!item_id) {
      return res.status(400).json({ message: "Item is required" });
    }

    if (!adjustment_type) {
      return res.status(400).json({ message: "Adjustment type is required" });
    }

    if (Number(quantity) < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    await conn.beginTransaction();

    const [[item]] = await conn.query(
      "SELECT id, name, stock FROM items WHERE id = ? FOR UPDATE",
      [item_id]
    );

    if (!item) {
      throw new Error("Item not found");
    }

    const oldStock = Number(item.stock || 0);
    let newStock = oldStock;

    if (adjustment_type === "Increase") {
      newStock = oldStock + Number(quantity);
    }

    if (adjustment_type === "Decrease") {
      newStock = oldStock - Number(quantity);
    }

    if (adjustment_type === "Set") {
      newStock = Number(quantity);
    }

    if (newStock < 0) {
      throw new Error("Stock cannot be less than zero");
    }

    const adjustmentNo = "ADJ-" + Date.now();

    await conn.query(
      `
      INSERT INTO inventory_adjustments
      (
        adjustment_no,
        item_id,
        item_name,
        adjustment_type,
        old_stock,
        quantity,
        new_stock,
        reason,
        adjusted_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adjustmentNo,
        item_id,
        item_name || item.name,
        adjustment_type,
        oldStock,
        quantity,
        newStock,
        reason || "",
        adjusted_by || "",
      ]
    );

    await conn.query(
      "UPDATE items SET stock = ? WHERE id = ?",
      [newStock, item_id]
    );

    await conn.commit();

    res.json({
      message: "Inventory adjusted successfully",
      adjustment_no: adjustmentNo,
      old_stock: oldStock,
      new_stock: newStock,
    });
  } catch (err) {
    await conn.rollback();
    console.error("CREATE ADJUSTMENT ERROR:", err);
    res.status(500).json({
      message: err.message || "Failed to save adjustment",
    });
  } finally {
    conn.release();
  }
});

app.listen(port, "0.0.0.0", () =>
  console.log(`API running on http://localhost:${port}`)
);

app.post("/api/sales", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      customer,
      paymentMethod,
      subtotal,
      discount,
      total,
      cash,
      change,
      items,
      cashier_name,
    } = req.body;

    await conn.beginTransaction();
    const [lastSale] = await conn.query(`
      SELECT id
      FROM sales
      ORDER BY id DESC
      LIMIT 1
    `);

    let txId = "00000001";

    if (lastSale.length > 0) {
      const nextId = Number(lastSale[0].id) + 1;

      txId =
        String(nextId).padStart(8, "0");
    }
    const [saleResult] = await conn.query(
        `
        INSERT INTO sales
        (
          tx_id,
          customer,
          payment_method,
          subtotal,
          discount,
          total,
          cash,
          change_amount,
          cashier_name,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          txId,
          customer || "Walk-in",
          paymentMethod || "cash",
          subtotal || 0,
          discount || 0,
          total || 0,
          cash || 0,
          change || 0,
          cashier_name || "Cashier",
        ]
      );

    const saleId = saleResult.insertId;

    for (const item of items) {
      const lineTotal = Number(item.qty) * Number(item.price);

      await conn.query(
        `
        INSERT INTO sale_items 
        (sale_id, item_id, item_name, sku, qty, price, total, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          saleId,
          item.id,
          item.name,
          item.sku,
          item.qty,
          item.price,
          lineTotal,
          lineTotal,
        ]
      );

      await conn.query(
        `
        UPDATE items
        SET stock = stock - ?
        WHERE id = ?
        `,
        [item.qty, item.id]
      );

    }

    await conn.commit();

    res.json({
      message: "Sale saved successfully",
      sale_id: saleId,
      tx_id: txId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("SAVE SALE ERROR:", err);

    res.status(500).json({
      message: "Failed to save sale",
      error: err.message,
    });
  } finally {
    conn.release();
  }
});

app.get("/api/sales", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.id,
        s.tx_id,
        s.customer,
        s.payment_method,
        s.subtotal,
        s.discount,
        s.total,
        s.cash,
        s.change_amount,
        s.created_at,
        COUNT(si.id) AS total_items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/reports/profit-loss", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COALESCE(SUM(si.total), 0) AS gross_sales,
        COALESCE(SUM(si.qty * i.cost), 0) AS cost_of_goods,
        COALESCE(SUM(si.total - (si.qty * i.cost)), 0) AS gross_profit,
        COALESCE((SELECT SUM(discount) FROM sales), 0) AS total_discount,
        COALESCE(
          SUM(si.total - (si.qty * i.cost)) - 
          (SELECT COALESCE(SUM(discount), 0) FROM sales),
          0
        ) AS net_profit
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/reports/sales-summary", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) AS daily_sales,

        COALESCE(SUM(CASE 
          WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) 
          THEN total ELSE 0 END), 0) AS weekly_sales,

        COALESCE(SUM(CASE 
          WHEN YEAR(created_at) = YEAR(CURDATE())
          AND MONTH(created_at) = MONTH(CURDATE())
          THEN total ELSE 0 END), 0) AS monthly_sales,

        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS daily_transactions,
        COUNT(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) AS weekly_transactions,
        COUNT(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN 1 END) AS monthly_transactions
      FROM sales
    `);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/reports/sold-items/:period", async (req, res) => {
  try {
    const { period } = req.params;

    let salesDateCondition = "";
    let creditDateCondition = "";

    if (period === "daily") {
      salesDateCondition = "DATE(s.created_at) = CURDATE()";
      creditDateCondition = "DATE(cs.created_at) = CURDATE()";
    } else if (period === "weekly") {
      salesDateCondition = "YEARWEEK(s.created_at, 1) = YEARWEEK(CURDATE(), 1)";
      creditDateCondition = "YEARWEEK(cs.created_at, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (period === "monthly") {
      salesDateCondition = `
        YEAR(s.created_at) = YEAR(CURDATE())
        AND MONTH(s.created_at) = MONTH(CURDATE())
      `;
      creditDateCondition = `
        YEAR(cs.created_at) = YEAR(CURDATE())
        AND MONTH(cs.created_at) = MONTH(CURDATE())
      `;
    } else {
      return res.status(400).json({ error: "Invalid report period" });
    }

    const [rows] = await db.query(`
      SELECT
        item_id,
        item_name,
        sku,
        price,
        SUM(normal_qty) AS normal_qty_sold,
        SUM(credit_qty) AS credit_qty_sold,
        SUM(normal_sales) AS normal_sales,
        SUM(credit_sales) AS credit_sales,
        SUM(normal_qty + credit_qty) AS total_qty_sold,
        SUM(normal_sales + credit_sales) AS total_sales
      FROM (
        SELECT
          si.item_id,
          si.item_name,
          si.sku,
          si.price,
          SUM(si.qty) AS normal_qty,
          0 AS credit_qty,
          SUM(si.total) AS normal_sales,
          0 AS credit_sales
        FROM sale_items si
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE ${salesDateCondition}
        GROUP BY si.item_id, si.item_name, si.sku, si.price

        UNION ALL

        SELECT
          csi.item_id,
          csi.item_name,
          csi.sku,
          csi.price,
          0 AS normal_qty,
          SUM(csi.qty) AS credit_qty,
          0 AS normal_sales,
          SUM(csi.total) AS credit_sales
        FROM credit_sale_items csi
        INNER JOIN credit_sales cs ON csi.credit_sale_id = cs.id
        WHERE ${creditDateCondition}
        GROUP BY csi.item_id, csi.item_name, csi.sku, csi.price
      ) combined
      GROUP BY item_id, item_name, sku, price
      ORDER BY total_qty_sold DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/dashboard", async (req, res) => {
  try {
    const [[salesToday]] = await db.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM sales
      WHERE DATE(created_at) = CURDATE()
    `);

    const [[itemsCount]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM items
    `);

    const [[lowStock]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM items
      WHERE stock < 5
    `);

    const [[monthlyProfit]] = await db.query(`
      SELECT
      COALESCE(SUM(si.total - (si.qty * i.cost)), 0) AS total
      FROM sale_items si
      LEFT JOIN sales s ON si.sale_id = s.id
      LEFT JOIN items i ON si.item_id = i.id
      WHERE YEAR(s.created_at) = YEAR(CURDATE())
      AND MONTH(s.created_at) = MONTH(CURDATE())
    `);

    const [recentSales] = await db.query(`
      SELECT 
        id,
        tx_id,
        customer,
        payment_method,
        total,
        created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      salesToday: salesToday.total,
      inventoryItems: itemsCount.total,
      lowStockItems: lowStock.total,
      monthlyProfit: monthlyProfit.total,
      recentSales,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/notifications/low-stock", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, sku, stock, unit
      FROM items
      WHERE stock < 5
      ORDER BY stock ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/customers", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM customers ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/customers", async (req, res) => {
  const { name, phone, address, status } = req.body;

  await db.query(
    "INSERT INTO customers (name, phone, address, status) VALUES (?, ?, ?, ?)",
    [name, phone, address, status || "Active"]
  );

  res.json({ message: "Customer added" });
});

app.put("/api/customers/:id", async (req, res) => {
  const { name, phone, address, status } = req.body;

  await db.query(
    "UPDATE customers SET name=?, phone=?, address=?, status=? WHERE id=?",
    [name, phone, address, status, req.params.id]
  );

  res.json({ message: "Customer updated" });
});

app.delete("/api/customers/:id", async (req, res) => {
  await db.query("DELETE FROM customers WHERE id=?", [req.params.id]);
  res.json({ message: "Customer deleted" });
});
app.get("/api/credit-sales/unpaid", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM credit_sales
      WHERE status != 'paid'
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load unpaid credits", error: err.message });
  }
});

app.post("/api/credit-sales", async (req, res) => {
  try {
    const { creditNo, customer, total, items } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO credit_sales
      (credit_no, customer_name, total, status)
      VALUES (?, ?, ?, 'unpaid')
      `,
      [
        creditNo,
        customer.name,
        total
      ]
    );

    const creditId = result.insertId;

    for (const item of items) {
      await db.query(
        `
        INSERT INTO credit_sale_items
        (credit_sale_id, item_id, item_name, qty, price, total)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          creditId,
          item.id,
          item.name,
          item.qty,
          item.price,
          item.qty * item.price
        ]
      );

      await db.query(
        `
        UPDATE items
        SET stock = stock - ?
        WHERE id = ?
        `,
        [item.qty, item.id]
      );
    }

    res.json({
      message: "Credit sale saved successfully",
      credit_id: creditId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to save credit sale",
      error: err.message,
    });
  }
});

app.get("/api/credit-sales/:id/payments", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM credit_payments
      WHERE credit_sale_id = ?
      ORDER BY created_at DESC
      `,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load payments", error: err.message });
  }
});
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const { name, phone, address, status } = req.body;

    await db.query(
      "INSERT INTO customers (name, phone, address, status) VALUES (?, ?, ?, ?)",
      [name, phone, address, status || "Active"]
    );

    res.json({ message: "Customer added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const { name, phone, address, status } = req.body;

    await db.query(
      "UPDATE customers SET name=?, phone=?, address=?, status=? WHERE id=?",
      [name, phone, address, status || "Active", req.params.id]
    );

    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM customers WHERE id=?", [req.params.id]);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/credit-sales/unpaid", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM credit_sales
      WHERE status != 'paid'
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load unpaid credits", error: err.message });
  }
});

app.post("/api/credit-sales/:id/payment", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { id } = req.params;
    const { payment_amount, payment_method, received_by } = req.body;

    await conn.beginTransaction();

    const [[credit]] = await conn.query(
      `SELECT * FROM credit_sales WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (!credit) {
      throw new Error("Credit sale not found");
    }

    const currentPaid = Number(credit.paid_amount || 0);
    const total = Number(credit.total || 0);
    const amount = Number(payment_amount || 0);

    if (amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    if (amount > total - currentPaid) {
      throw new Error("Payment amount is greater than remaining balance");
    }

    const newPaid = currentPaid + amount;
    const newBalance = total - newPaid;
    const newStatus = newBalance <= 0 ? "paid" : "partial";

    await conn.query(
      `
      INSERT INTO credit_payments
      (credit_sale_id, payment_amount, payment_method, received_by)
      VALUES (?, ?, ?, ?)
      `,
      [id, amount, payment_method || "cash", received_by || "Cashier"]
    );

    await conn.query(
      `
      UPDATE credit_sales
      SET paid_amount = ?, balance = ?, status = ?
      WHERE id = ?
      `,
      [newPaid, newBalance, newStatus, id]
    );

    await conn.commit();

    res.json({
      message: "Payment saved successfully",
      paid_amount: newPaid,
      balance: newBalance,
      status: newStatus,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Failed to save payment", error: err.message });
  } finally {
    conn.release();
  }
});

app.get("/api/credit-sales/:id/payments", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM credit_payments
      WHERE credit_sale_id = ?
      ORDER BY created_at DESC
      `,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to load payments", error: err.message });
  }
});

app.post("/api/credit-sales/:id/pay", async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { amount } = req.body;
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      throw new Error("Payment amount is required.");
    }

    const [rows] = await conn.query(
      "SELECT * FROM credit_sales WHERE id = ? FOR UPDATE",
      [req.params.id]
    );

    if (!rows.length) {
      throw new Error("Credit transaction not found.");
    }

    const credit = rows[0];
    const newPaid = Number(credit.paid_amount || 0) + paymentAmount;
    const newBalance = Math.max(0, Number(credit.total) - newPaid);

    let status = "partially paid";
    if (newBalance <= 0) status = "fully paid";
    if (newPaid <= 0) status = "unpaid";

    await conn.query(
      `UPDATE credit_sales 
       SET paid_amount = ?, balance = ?, status = ?
       WHERE id = ?`,
      [newPaid, newBalance, status, req.params.id]
    );

    await conn.commit();

    res.json({ message: "Payment saved successfully." });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.delete("/api/credit-sales/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM credit_sales WHERE id = ?", [req.params.id]);
    res.json({ message: "Credit transaction deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/sales/history", async (req, res) => {
  try {
    const { date } = req.query;

    const [rows] = await db.query(
      `
      SELECT 
        s.id,
        s.tx_id AS transaction_no,
        s.total,
        COALESCE(s.cashier_name, 'N/A') AS cashier_name,
        s.created_at,
        DATE_FORMAT(s.created_at, '%h:%i %p') AS time
      FROM sales s
      WHERE DATE(s.created_at) = ?
      ORDER BY s.created_at DESC
      `,
      [date]
    );

    res.json(rows);
  } catch (err) {
    console.error("CHECKOUT HISTORY ERROR:", err);

    res.status(500).json({
      message: "Failed to load checkout history",
      error: err.message,
    });
  }
});

app.get("/api/sales/:id/items", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        si.id,
        i.name AS item_name,
        si.qty,
        si.price,
        si.line_total
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      WHERE si.sale_id = ?
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load sale items" });
  }
});

app.get("/api/sales/:id/items", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        si.id,
        si.qty,
        si.price,
        si.line_total,
        COALESCE(i.name, 'Deleted Item') AS item_name
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      WHERE si.sale_id = ?
      ORDER BY si.id ASC
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("SALE ITEMS ERROR:", err);
    res.status(500).json({
      message: "Failed to load sale items",
      error: err.message,
    });
  }
app.get("/api/reports/inventory", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        *,
        CASE
          WHEN stock <= 0 THEN 'Out of Stock'
          WHEN stock BETWEEN 1 AND 10 THEN 'Low Stock'
          WHEN stock BETWEEN 11 AND 50 THEN 'In Stock'
          ELSE 'High Stock'
        END AS stock_status
      FROM items
      ORDER BY stock ASC, name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("INVENTORY REPORT ERROR:", err);
    res.status(500).json({
      message: "Failed to load inventory report",
      error: err.message,
    });
  }
});
});