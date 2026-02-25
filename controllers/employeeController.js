const db = require("../db");

// ✅ GET ALL
exports.getAllEmployees = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const offset = (page - 1) * limit;

  const sql = "SELECT * FROM employees LIMIT ? OFFSET ?";

  db.query(sql, [limit, offset], (err, results) => {
    if (err) return next(err);

    res.status(200).json({
      success: true,
      page,
      limit,
      count: results.length,
      data: results
    });
  });
};

// ✅ GET BY ID
exports.getEmployeeById = (req, res, next) => {
  const id = req.params.id;

  const sql = "SELECT * FROM employees WHERE emp_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) return next(err);

    if (results.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(results[0]);
  });
};

// ✅ CREATE
exports.createEmployee = (req, res, next) => {
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
      if (err) return next(err);

      res.status(201).json({
        message: "Employee created successfully",
        employeeId: result.insertId
      });
    }
  );
};

// ✅ UPDATE
exports.updateEmployee = (req, res, next) => {
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
      if (err) return next(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.status(200).json({ message: "Employee updated successfully" });
    }
  );
};

// ✅ DELETE
exports.deleteEmployee = (req, res, next) => {
  const id = req.params.id;

  const sql = "DELETE FROM employees WHERE emp_id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return next(err);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee deleted successfully" });
  });
};
