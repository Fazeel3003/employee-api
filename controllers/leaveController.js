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
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // ✅ safety
    const offset = (page - 1) * limit;

    let conditions = [];
    let queryParams = [];

    // ✅ USER FILTER
    if (req.filterByUser) {
      if (!req.user?.email) {
        return res.status(400).json({
          success: false,
          message: "User email missing in token"
        });
      }

      const [empRows] = await db.query(
        "SELECT emp_id FROM employees WHERE email = ?",
        [req.user.email]
      );

      if (!empRows.length) {
        return res.json({
          success: true,
          data: [],
          page: 1,
          totalPages: 0,
          totalCount: 0
        });
      }

      conditions.push("lr.emp_id = ?"); // FIXED (alias)
      queryParams.push(empRows[0].emp_id);
    }

    // MANAGER FILTER
    else if (req.filterByManager) {
      if (!req.user?.email) {
        return res.status(400).json({
          success: false,
          message: "User email missing in token"
        });
      }

      const [mgrRows] = await db.query(
        "SELECT emp_id FROM employees WHERE email = ?",
        [req.user.email]
      );

      if (!mgrRows.length) {
        return res.json({
          success: true,
          data: [],
          page: 1,
          totalPages: 0,
          totalCount: 0
        });
      }

      conditions.push("e.manager_id = ?");
      queryParams.push(mgrRows[0].emp_id);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // COUNT QUERY (SAFE)
    // ✅ COUNT QUERY (SAFE)
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total 
       FROM leave_requests lr
       JOIN employees e ON lr.emp_id = e.emp_id
       ${whereClause}`,
      queryParams
    );

    const totalCount = countResult[0].total;

    // ✅ MAIN QUERY (NO AMBIGUITY)
    const [rows] = await db.query(
      `SELECT 
        lr.leave_id,
        lr.emp_id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.reason,
        lr.approval_status,
        lr.approved_by,
        lr.requested_at,
        e.first_name,
        e.last_name
      FROM leave_requests lr
      JOIN employees e ON lr.emp_id = e.emp_id
      ${whereClause}
      ORDER BY lr.requested_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: rows,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (err) {
    console.error("getAllLeaveRequests ERROR:", err.message, err.sqlMessage);

    res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
      error: err.message,
      sqlError: err.sqlMessage
    });
  }
};

// Get leave by employee
exports.getLeaveByEmployee = async (req, res, next) => {
  try {
    const empId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM leave_requests WHERE lr.emp_id = ? ORDER BY requested_at DESC",
      [empId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// Update leave request
exports.updateLeaveStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { emp_id, leave_type, start_date, end_date, reason, approval_status } = req.body;

    if (req.checkOwnershipForEdit) {
      const [empRows] = await db.query(
        "SELECT emp_id FROM employees WHERE email = ?",
        [req.user.email]
      );

      const [leaveRows] = await db.query(
        "SELECT emp_id, approval_status FROM leave_requests WHERE leave_id = ?",
        [id]
      );

      if (!leaveRows.length) {
        return res.status(404).json({ success: false, message: "Leave request not found" });
      }

      if (leaveRows[0].emp_id !== empRows[0].emp_id) {
        return res.status(403).json({ success: false, message: "You can only edit your own leave requests" });
      }

      if (leaveRows[0].approval_status !== "Pending") {
        return res.status(403).json({ success: false, message: "Cannot edit approved/rejected requests" });
      }
    }

    if (approval_status !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Use approve/reject endpoints for status change"
      });
    }

    const [result] = await db.query(
      `UPDATE leave_requests
       SET emp_id = ?, leave_type = ?, start_date = ?, end_date = ?, reason = ?
       WHERE leave_id = ?`,
      [emp_id, leave_type, start_date, end_date, reason, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    res.status(200).json({ success: true, message: "Leave updated successfully" });

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
      `UPDATE leave_requests SET approval_status = 'Approved', approved_by = ? WHERE leave_id = ?`,
      [approved_by, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    res.status(200).json({ success: true, message: "Leave approved successfully" });

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
      `UPDATE leave_requests SET approval_status = 'Rejected', approved_by = ? WHERE leave_id = ?`,
      [approved_by, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    res.status(200).json({ success: true, message: "Leave rejected successfully" });

  } catch (error) {
    next(error);
  }
};

// Delete leave
exports.deleteLeave = async (req, res, next) => {
  try {
    const id = req.params.id;

    if (req.checkOwnershipForDelete) {
      const [empRows] = await db.query(
        "SELECT emp_id FROM employees WHERE email = ?",
        [req.user.email]
      );

      const [leaveRows] = await db.query(
        "SELECT emp_id, approval_status FROM leave_requests WHERE leave_id = ?",
        [id]
      );

      if (!leaveRows.length) {
        return res.status(404).json({ success: false, message: "Leave request not found" });
      }

      if (leaveRows[0].emp_id !== empRows[0].emp_id) {
        return res.status(403).json({ success: false, message: "You can only delete your own leave" });
      }

      if (leaveRows[0].approval_status !== "Pending") {
        return res.status(403).json({ success: false, message: "Cannot delete approved/rejected leave" });
      }
    }

    const [result] = await db.query(
      "DELETE FROM leave_requests WHERE leave_id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    res.status(200).json({ success: true, message: "Leave deleted successfully" });

  } catch (error) {
    next(error);
  }
};

// Pending count
exports.getPendingLeaveCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM leave_requests WHERE approval_status = 'Pending'`
    );

    res.json({ count: rows[0].count });

  } catch (error) {
    next(error);
  }
};