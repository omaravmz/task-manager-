require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const initDatabase = require("./src/db/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    }
};

async function startServer() {
    await initDatabase(dbConfig);
    const pool = mysql.createPool(dbConfig);

    app.get("/api/tasks", async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT * FROM tasks ORDER BY due_date DESC");
            res.json(rows);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            res.status(500).json({ message: "Internal server error" });
        }

    });

    app.get("/api/tasks/:id", async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
            if (rows.length === 0) {
                return res.status(404).json({ message: "Not found" });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error("Error fetching task:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    app.post("/api/tasks", async (req, res) => {
        try {
            const { title, priority, due_date } = req.body;
            if (!title || !due_date) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            await pool.query(
                `INSERT INTO tasks (title, priority, due_date) VALUES (?, ?, ?)`,
                [title, priority, due_date]
            );
            res.status(201).json({ message: "Created" });
        } catch (error) {
            console.error("Error creating task:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });

    app.put("/api/tasks/:id", async (req, res) => {
        const { title, status, priority, due_date } = req.body;
        await pool.query(
            `UPDATE tasks SET title = ?, status = ?, priority = ?, due_date = ? WHERE id = ?`,
            [title, status, priority, due_date, req.params.id]
        );
        res.json({ message: "Updated" });
    });

    app.delete("/api/tasks/:id", async (req, res) => {
        await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
        res.json({ message: "Deleted" });
    });

    app.listen(process.env.PORT, () => {
        console.log(`Server running in port: ${process.env.PORT}`);
    });
}

startServer();