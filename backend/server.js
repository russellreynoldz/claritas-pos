import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
app.use(cors());
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
app.listen(port, () => console.log(`API running on http://localhost:${port}`));

app.post("/api/sales", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      txId,
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
app.post("/api/credit-sales", async (req, res) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const { creditNo, customer, total, items } = req.body;

    if (!customer?.id) {
      throw new Error("Customer is required.");
    }

    for (const item of items) {
      const [rows] = await conn.query(
        "SELECT stock FROM items WHERE id=? FOR UPDATE",
        [item.id]
      );

      if (!rows.length) throw new Error(`Item not found: ${item.name}`);
      if (rows[0].stock < item.qty) throw new Error(`Not enough stock for ${item.name}`);
    }

    const [result] = await conn.query(
      `INSERT INTO credit_sales 
      (
        credit_no,
        customer_id,
        customer_name,
        total,
        paid_amount,
        balance,
        status
      )
      VALUES (?, ?, ?, ?, 0, ?, 'unpaid')`,
      [
        creditNo,
        customer.id,
        customer.name,
        total,
        total
      ]
    );

    const creditSaleId = result.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO credit_sale_items
         (credit_sale_id, item_id, item_name, sku, qty, price, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          creditSaleId,
          item.id,
          item.name,
          item.sku,
          item.qty,
          item.price,
          item.price * item.qty,
        ]
      );

      await conn.query(
        "UPDATE items SET stock = stock - ? WHERE id = ?",
        [item.qty, item.id]
      );
    }

    await conn.commit();

    res.json({ message: "Credit transaction saved", creditSaleId });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
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
app.get("/api/credit-sales", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM credit_sales
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        CONCAT('TX-', LPAD(s.id, 6, '0')) AS transaction_no,
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
});