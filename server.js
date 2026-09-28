const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;


// Allow JSON data
app.use(express.json());


// Serve index.html
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "expenses_db"
});

db.connect((err) => {
    if(err){
        console.error("Database connection failed: ", err);
        return;
    }
    console.log("Connected to MySQL.");
})


//GET - Retrieve
app.get("/api/expenses", (req, res) => {
    const sql = "SELECT * FROM expenses";

    db.query(sql, (err, results) => {
        if(err){
            return res.status(500).json({
                message: "Database error."
            });
        }
        res.json(results);
    });
});

//POST - INSERT EXPENSE
app.post("/api/expenses", (req, res) => {
    const name = req.body.name;
    const amount = req.body.amount;
    const category = req.body.category;
    const date = req.body.date;

    const sql = `
        INSERT INTO students(name, amount, category, date)
        VALUES(?,?,?,?)
    `;

    db.query(sql, [name, amount, category, date], (err, result) => {
        if(err){
            return res.status(500).json({
                message: "Database error."
            });
        }
        res.status(201).json({
            message: "Successfully added expense.",
            id: result.insertId
        });
    });
})


// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});