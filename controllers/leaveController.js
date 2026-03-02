const db = require("../db");

// Apply leave
exports.applyLeave = async (req, res, next) => {
  try {
    const { emp_id, leave_type, start_date, end_date, reason } = req.body;

    const [result] = await db.query(
      `INSERT INTO leave_requests
       (emp_id, leave_type, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [emp_id, leave_type, start_date, end_date, reason]
    );

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leaveId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// Get leave history
exports.getLeaveByEmployee = async (req, res, next) => {
  try {
    const empId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM leave_requests WHERE emp_id = ?",
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

// Approve / Reject leave
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { approval_status, approved_by } = req.body;

    await db.query(
      `UPDATE leave_requests
       SET approval_status = ?, approved_by = ?
       WHERE leave_id = ?`,
      [approval_status, approved_by, id]
    );

    res.status(200).json({
      success: true,
      message: "Leave status updated"
    });

  } catch (error) {
    next(error);
  }
};