const db = require("../db");

// ✅ GET ALL
exports.getAllEmployees = (req, res) => {
  const sql = "SELECT * FROM employees";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};

// ✅ GET BY ID
exports.getEmployeeById = (req, res) => {
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
};

// ✅ CREATE
exports.createEmployee = (req, res) => {
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
};

// ✅ UPDATE
exports.updateEmployee = (req, res) => {
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
};

// ✅ DELETE
exports.deleteEmployee = (req, res) => {
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
};
