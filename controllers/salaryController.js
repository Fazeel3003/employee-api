const db = require("../db");

// Add salary record
exports.addSalaryRecord = async (req, res, next) => {
  try {
    const { emp_id, salary_amount, effective_from, effective_to, change_reason } = req.body;

    const [result] = await db.query(
      `INSERT INTO salary_history
       (emp_id, salary_amount, effective_from, effective_to, change_reason)
       VALUES (?, ?, ?, ?, ?)`,
      [emp_id, salary_amount, effective_from, effective_to, change_reason]
    );

    res.status(201).json({
      success: true,
      message: "Salary record added",
      salaryId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// Get all salary history with pagination and filtering
exports.getAllSalaryHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const empId = req.query.emp_id || "";
    const offset = (page - 1) * limit;

    let whereClause = "";
    let queryParams = [];

    if (req.filterByUser) {
      // USER: only their own salary
      // Find their emp_id from users table via email
      const [empRows] = await db.query(
        'SELECT emp_id FROM employees WHERE email = ?',
        [req.user.email]
      );
      
      if (empRows.length === 0) {
        return res.json({ 
          success: true, 
          data: [], 
          page: 1,
          totalPages: 0,
          totalCount: 0
        });
      }
      
      whereClause = "WHERE emp_id = ?";
      queryParams = [empRows[0].emp_id];

    } else if (req.filterByManager) {
      // MANAGER: only their team's salary
      const [mgrRows] = await db.query(
        'SELECT emp_id FROM employees WHERE email = ?',
        [req.user.email]
      );
      
      if (mgrRows.length === 0) {
        return res.json({ 
          success: true, 
          data: [], 
          page: 1,
          totalPages: 0,
          totalCount: 0
        });
      }
      
      whereClause = "WHERE emp_id IN (SELECT emp_id FROM employees WHERE manager_id = ?)";
      queryParams = [mgrRows[0].emp_id];

    } else {
      // ADMIN/HR: no filter — see all records
      if (empId) {
        whereClause = "WHERE emp_id = ?";
        queryParams = [empId];
      }
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM salary_history ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // Get paginated data
    const [rows] = await db.query(
      `SELECT * FROM salary_history ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: rows,
      page: page,
      totalPages: totalPages,
      totalCount: totalCount
    });

  } catch (error) {
    next(error);
  }
};

// Get salary by employee
exports.getSalaryByEmployee = async (req, res, next) => {
  try {
    const empId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM salary_history WHERE emp_id = ? ORDER BY created_at DESC",
      [empId]
    );

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

// Get salary by ID
exports.getSalaryById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM salary_history WHERE salary_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    next(error);
  }
};

// Update salary record
exports.updateSalaryRecord = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { emp_id, salary_amount, effective_from, effective_to, change_reason } = req.body;

    const [result] = await db.query(
      `UPDATE salary_history
       SET emp_id = ?, salary_amount = ?, effective_from = ?, effective_to = ?, change_reason = ?
       WHERE salary_id = ?`,
      [emp_id, salary_amount, effective_from, effective_to, change_reason, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Salary record updated successfully"
    });

  } catch (error) {
    next(error);
  }
};

// Delete salary record
exports.deleteSalaryRecord = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(
      "DELETE FROM salary_history WHERE salary_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Salary record deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

// GET TOTAL SALARY
exports.getTotalSalary = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT SUM(salary_amount) as total,
              COUNT(*) as count
       FROM salary_history`
    );
    
    res.json({ 
      total: rows[0].total || 0,
      count: rows[0].count || 0
    });
  } catch (error) {
    next(error);
  }
};

// GET SALARY COUNT
exports.getSalaryCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM salary_history`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};
