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

// Get salary history
exports.getSalaryByEmployee = async (req, res, next) => {
  try {
    const empId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM salary_history WHERE emp_id = ?",
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

//Update
exports.updateSalaryRecord = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { salary_amount, effective_from, effective_to, change_reason } = req.body;

    const [result] = await db.query(
      `UPDATE salary_history
       SET salary_amount = ?, effective_from = ?, effective_to = ?, change_reason = ?
       WHERE salary_id = ?`,
      [salary_amount, effective_from, effective_to, change_reason, id]
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

//Delete
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