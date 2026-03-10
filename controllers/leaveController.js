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

// Get all leave requests with pagination and filtering
exports.getAllLeaveRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const empId = req.query.emp_id || "";
    const offset = (page - 1) * limit;

    let whereClause = "";
    let queryParams = [];

    if (empId) {
      whereClause = "WHERE emp_id = ?";
      queryParams.push(empId);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM leave_requests ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // Get paginated data
    const [rows] = await db.query(
      `SELECT * FROM leave_requests ${whereClause} ORDER BY requested_at DESC LIMIT ? OFFSET ?`,
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

// Get leave by employee
exports.getLeaveByEmployee = async (req, res, next) => {
  try {
    const empId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM leave_requests WHERE emp_id = ? ORDER BY requested_at DESC",
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

// Update leave request details (NOT status - use approve/reject endpoints for status changes)
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { emp_id, leave_type, start_date, end_date, reason, approval_status } = req.body;

    // SECURITY: Prevent status changes through general edit endpoint
    if (approval_status !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Status cannot be changed through edit endpoint. Use approve/reject endpoints."
      });
    }

    // Only allow editing of details, not status
    const [result] = await db.query(
      `UPDATE leave_requests
       SET emp_id = ?, leave_type = ?, start_date = ?, end_date = ?, reason = ?
       WHERE leave_id = ?`,
      [emp_id, leave_type, start_date, end_date, reason, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave request updated successfully"
    });

  } catch (error) {
    next(error);
  }
};

// Approve leave
exports.approveLeave = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { approved_by } = req.body;

    const [result] = await db.query(
      `UPDATE leave_requests
       SET approval_status = 'Approved', approved_by = ?
       WHERE leave_id = ?`,
      [approved_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave approved successfully"
    });

  } catch (error) {
    next(error);
  }
};

// Reject leave
exports.rejectLeave = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { approved_by } = req.body;

    const [result] = await db.query(
      `UPDATE leave_requests
       SET approval_status = 'Rejected', approved_by = ?
       WHERE leave_id = ?`,
      [approved_by, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave rejected successfully"
    });

  } catch (error) {
    next(error);
  }
};

// Delete leave
exports.deleteLeave = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(
      "DELETE FROM leave_requests WHERE leave_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave request deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
