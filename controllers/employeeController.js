const db = require("../db");

// ✅ GET ALL (with pagination, search, sorting)
exports.getAllEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sort = req.query.sort || "emp_id";
    const order =
      req.query.order && req.query.order.toLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    const offset = (page - 1) * limit;

    const allowedSortFields = [
      "emp_id",
      "first_name",
      "last_name",
      "email",
      "hire_date",
      "created_at"
    ];

    const sortField = allowedSortFields.includes(sort)
      ? sort
      : "emp_id";

    let baseQuery = "FROM employees";
    let searchQuery = "";
    let queryParams = [];

    if (search) {
      searchQuery = `
        WHERE first_name LIKE ?
        OR last_name LIKE ?
        OR email LIKE ?
      `;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) AS total ${baseQuery} ${searchQuery}`;
    const dataQuery = `
      SELECT * ${baseQuery}
      ${searchQuery}
      ORDER BY ${sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    const [countResult] = await db.query(countQuery, queryParams);
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    const [results] = await db.query(
      dataQuery,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      success: true,
      page,
      limit,
      totalRecords,
      totalPages,
      sort: sortField,
      order,
      data: results
    });

  } catch (error) {
    next(error);
  }
};


// ✅ GET BY ID
exports.getEmployeeById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [results] = await db.query(
      "SELECT * FROM employees WHERE emp_id = ?",
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      data: results[0]
    });

  } catch (error) {
    next(error);
  }
};


// ✅ CREATE
exports.createEmployee = async (req, res, next) => {
  try {
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

    const [result] = await db.query(sql, [
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
    ]);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employeeId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};


// ✅ UPDATE
exports.updateEmployee = async (req, res, next) => {
  try {
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

    const [result] = await db.query(sql, [
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
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully"
    });

  } catch (error) {
    next(error);
  }
};


// ✅ DELETE
exports.deleteEmployee = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(
      "DELETE FROM employees WHERE emp_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
