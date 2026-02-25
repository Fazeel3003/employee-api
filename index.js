const db = require("./db");
const express = require('express');
const app = express();

app.use(express.json());


// ✅ Validation Middleware
function validateEmployee(req, res, next) {
    const { name, position, salary } = req.body;

    if (!name || !position || salary === undefined) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (typeof salary !== "number") {
        return res.status(400).json({ message: "Salary must be a number" });
    }

    next();
}

// ✅ GET ALL
app.get("/employees", (req, res) => {
  const sql = "SELECT * FROM employees";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json(results);
  });
});


// ✅ GET BY ID
app.get("/employees/:id", (req, res) => {
  const id = req.params.id;

  const sql = "SELECT * FROM employees WHERE emp_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(results[0]);
  });
});

// ✅ CREATE
app.post("/employees", (req, res) => {
  const {
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    hire_date,
    status,
    dept_id,
    position_id,
    manager_id
  } = req.body;

  const sql = `
    INSERT INTO employees
    (employee_code, first_name, last_name, email, phone, hire_date, status, dept_id, position_id, manager_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      status,
      dept_id,
      position_id,
      manager_id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Employee created successfully",
        employeeId: result.insertId
      });
    }
  );
});


// ✅ UPDATE 
app.put("/employees/:id", (req, res) => {
  const id = req.params.id;

  const {
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    hire_date,
    status,
    dept_id,
    position_id,
    manager_id
  } = req.body;

  const sql = `
    UPDATE employees SET
      employee_code = ?,
      first_name = ?,
      last_name = ?,
      email = ?,
      phone = ?,
      hire_date = ?,
      status = ?,
      dept_id = ?,
      position_id = ?,
      manager_id = ?
    WHERE emp_id = ?
  `;

  db.query(
    sql,
    [
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      hire_date,
      status,
      dept_id,
      position_id,
      manager_id,
      id
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.status(200).json({ message: "Employee updated successfully" });
    }
  );
});


// ✅ DELETE 
app.delete("/employees/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM employees WHERE emp_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee deleted successfully" });
  });
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});
