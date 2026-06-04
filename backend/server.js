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
