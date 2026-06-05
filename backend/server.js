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
    await conn.beginTransaction();

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
    } = req.body;

    for (const item of items) {
      const [rows] = await conn.query(
        "SELECT stock FROM items WHERE id = ? FOR UPDATE",
        [item.id]
      );

      if (!rows.length) {
        throw new Error(`Item not found: ${item.name}`);
      }

      if (rows[0].stock < item.qty) {
        throw new Error(`Not enough stock for ${item.name}`);
      }
    }

    const [saleResult] = await conn.query(
      `INSERT INTO sales 
      (tx_id, customer, payment_method, subtotal, discount, total, cash, change_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [txId, customer, paymentMethod, subtotal, discount, total, cash, change]
    );

    const saleId = saleResult.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO sale_items 
        (sale_id, item_id, item_name, sku, qty, price, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
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

    res.json({
      message: "Sale completed successfully",
      saleId,
      txId,
    });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
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

    let dateCondition = "";

    if (period === "daily") {
      dateCondition = "DATE(s.created_at) = CURDATE()";
    } else if (period === "weekly") {
      dateCondition = "YEARWEEK(s.created_at, 1) = YEARWEEK(CURDATE(), 1)";
    } else if (period === "monthly") {
      dateCondition = `
        YEAR(s.created_at) = YEAR(CURDATE())
        AND MONTH(s.created_at) = MONTH(CURDATE())
      `;
    } else {
      return res.status(400).json({ error: "Invalid report period" });
    }

    const [rows] = await db.query(`
      SELECT
        si.item_id,
        si.item_name,
        si.sku,
        SUM(si.qty) AS total_qty_sold,
        si.price,
        SUM(si.total) AS total_sales
      FROM sale_items si
      INNER JOIN sales s ON si.sale_id = s.id
      WHERE ${dateCondition}
      GROUP BY si.item_id, si.item_name, si.sku, si.price
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
