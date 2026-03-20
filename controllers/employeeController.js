const db = require("../db");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

// ✅ GET ACTIVE EMPLOYEES (for dropdowns - no pagination, all active only)
exports.getActiveEmployees = async (req, res, next) => {
  try {
    const [results] = await db.query(`
      SELECT 
        e.emp_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.status,
        p.position_title,
        d.dept_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      WHERE e.status = 'Active'
      ORDER BY e.first_name ASC
    `);

    res.status(200).json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    next(error);
  }
};

// ✅ GET ALL (with pagination, search, sorting)
exports.getAllEmployees = async (req, res, next) => {
  // Apply authentication middleware manually for this example
  // In routes, you would use: router.get('/', [verifyToken, verifyRole(['admin', 'manager'])], employeeController.getAllEmployees);
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
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // For users, verify this emp_id belongs to them
    if (userRole === 'user') {
      const [ownership] = await db.query(`
        SELECT emp_id FROM employees 
        WHERE emp_id = ? AND email = (
          SELECT email FROM users WHERE id = ?
        )
      `, [id, userId]);

      if (ownership.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own employee record.',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }
    }

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
    /*
     * EMPLOYEES TABLE COLUMNS (verified):
     * employee_code, first_name, last_name,
     * email, phone, hire_date, status,
     * dept_id, position_id, manager_id
     * 
     * ⚠️ NO 'role' COLUMN EXISTS
     * ⚠️ NO 'name' COLUMN EXISTS  
     * ⚠️ NO 'base_salary' COLUMN EXISTS
     * Never add these to any query!
     */
    const {
      first_name,
      last_name,
      email,
      phone = null,
      hire_date,
      status = "Active",
      dept_id = null,
      position_id = null,
      manager_id = null
    } = req.body;

    const [maxRow] = await db.query(
      'SELECT MAX(emp_id) as maxId FROM employees'
    );
    const nextId = (maxRow[0].maxId || 0) + 1;
    const year = new Date().getFullYear();
    const employee_code = `EMP-${year}-${String(nextId).padStart(3, '0')}`;

    const sql = `
      INSERT INTO employees
      (employee_code, first_name, last_name, email, phone, hire_date, status, dept_id, position_id, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      employee_code,       // 1
      first_name,          // 2
      last_name,           // 3
      email,               // 4
      phone || null,       // 5
      hire_date,           // 6
      status || 'Active',  // 7
      dept_id || null,     // 8
      position_id || null, // 9
      manager_id || null   // 10
    ]);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employeeId: result.insertId,
      employee_code
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
};

// ✅ UPDATE
exports.updateEmployee = async (req, res, next) => {
  try {
    /*
     * EMPLOYEES TABLE COLUMNS (verified):
     * employee_code, first_name, last_name,
     * email, phone, hire_date, status,
     * dept_id, position_id, manager_id
     * 
     * ⚠️ NO 'role' COLUMN EXISTS
     * ⚠️ NO 'name' COLUMN EXISTS  
     * ⚠️ NO 'base_salary' COLUMN EXISTS
     * Never add these to any query!
     * 
     * ⚠️ employee_code NEVER updated - it's read-only
     */
    const id = req.params.id;

    const {
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
      first_name,          // 1
      last_name,           // 2
      email,               // 3
      phone,               // 4
      hire_date,           // 5
      status,              // 6
      dept_id,             // 7
      position_id,         // 8
      manager_id,          // 9
      id                   // 10 (WHERE)
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

// GET EMPLOYEE COUNT
exports.getEmployeeCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM employees 
       WHERE status = 'Active'`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

// GET NEW HIRES COUNT
exports.getNewHiresCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM employees 
       WHERE MONTH(hire_date) = MONTH(NOW())
       AND YEAR(hire_date) = YEAR(NOW())`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

// GET MANAGERS
exports.getManagers = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT emp_id, employee_code,
              first_name, last_name
       FROM employees
       WHERE status = 'Active'
       ORDER BY first_name ASC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// GET LOGGED-IN USER EMPLOYEE RECORD
exports.getMe = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE email = ?',
      [req.user.email]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found for this user'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
