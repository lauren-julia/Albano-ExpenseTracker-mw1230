const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "expenses_db"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: ", err);
        return;
    }
    console.log("Connected to MySQL database.");
});

// 1. GET - Retrieve all
app.get("/api/expenses", (req, res) => {
    const sql = "SELECT * FROM expenses ORDER BY date DESC, id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error while fetching expenses." });
        }
        res.json(results);
    });
});

// 2. GET - Retrieve single  item (Edit form)
app.get("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM expenses WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error." });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        res.json(results[0]);
    });
});

// 3. POST
app.post("/api/expenses", (req, res) => {
    const { name, amount, category, date } = req.body;

    if (!name || !amount || !category || !date) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const sql = "INSERT INTO expenses (name, amount, category, date) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, amount, category, date], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error while adding expense." });
        }
        res.status(201).json({
            message: "Successfully added expense.",
            id: result.insertId
        });
    });
});

// 4. PUT
app.put("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    const { name, amount, category, date } = req.body;

    if (!name || !amount || !category || !date) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const sql = "UPDATE expenses SET name = ?, amount = ?, category = ?, date = ? WHERE id = ?";
    db.query(sql, [name, amount, category, date, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error while updating expense." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        res.json({ message: "Successfully updated expense." });
    });
});

// 5. DELETE
app.delete("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM expenses WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error while deleting expense." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        res.json({ message: "Successfully deleted expense." });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
