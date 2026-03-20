const db = require("../db");

// GET ALL ATTENDANCE
const getAllAttendance = async (req, res) => {
  try {
    let whereClause = '';
    let params = [];

    if (req.filterByUser) {
      // USER: only their own attendance
      // Find their emp_id from users table via email
      const [empRows] = await db.query(
        'SELECT emp_id FROM employees WHERE email = ?',
        [req.user.email]
      );
      
      if (empRows.length === 0) {
        return res.json({ success: true, data: [], count: 0 });
      }
      
      whereClause = 'WHERE a.emp_id = ?';
      params = [empRows[0].emp_id];

    } else if (req.filterByManager) {
      // MANAGER: only their team's attendance
      const [mgrRows] = await db.query(
        'SELECT emp_id FROM employees WHERE email = ?',
        [req.user.email]
      );
      
      if (mgrRows.length === 0) {
        return res.json({ success: true, data: [], count: 0 });
      }
      
      whereClause = 'WHERE e.manager_id = ?';
      params = [mgrRows[0].emp_id];
    }
    // ADMIN/HR: no filter — see all records

    const [rows] = await db.query(`
      SELECT 
        a.attendance_id,
        a.emp_id,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        e.first_name,
        e.last_name,
        e.employee_code
      FROM attendance a
      JOIN employees e ON a.emp_id = e.emp_id
      ${whereClause}
      ORDER BY a.attendance_date DESC,
               a.attendance_id DESC
    `, params);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });

  } catch (err) {
    console.error('getAllAttendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: err.message
    });
  }
};

// CREATE ATTENDANCE
const createAttendance = async (req, res) => {
  try {
    const { emp_id, attendance_date, check_in, check_out, attendance_status } = req.body;
    
    // Validate required fields
    if (!emp_id || !attendance_date) {
      return res.status(400).json({
        success: false,
        message: 'emp_id and attendance_date are required'
      });
    }
    
    // Check for duplicate attendance
    const [existing] = await db.query(
      'SELECT attendance_id FROM attendance WHERE emp_id = ? AND attendance_date = ?',
      [emp_id, attendance_date]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this employee on this date'
      });
    }
    
    // Insert attendance
    const [result] = await db.query(
      `INSERT INTO attendance 
        (emp_id, attendance_date, check_in, check_out, attendance_status)
       VALUES (?, ?, ?, ?, ?)`,
      [emp_id, attendance_date, check_in, check_out, attendance_status]
    );
    
    // Fetch created attendance with employee details
    const [newAttendance] = await db.query(`
      SELECT 
        a.attendance_id,
        a.emp_id,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        e.first_name,
        e.last_name,
        e.employee_code
      FROM attendance a
      JOIN employees e ON a.emp_id = e.emp_id
      WHERE a.attendance_id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: newAttendance[0]
    });
    
  } catch (err) {
    console.error('createAttendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance',
      error: err.message
    });
  }
};

// UPDATE ATTENDANCE
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, attendance_status } = req.body;
    
    // Check if attendance exists
    const [exists] = await db.query(
      'SELECT attendance_id FROM attendance WHERE attendance_id = ?',
      [id]
    );
    
    if (exists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Update only check_in, check_out, and attendance_status (not emp_id or attendance_date)
    await db.query(
      `UPDATE attendance SET
        check_in = ?,
        check_out = ?,
        attendance_status = ?
       WHERE attendance_id = ?`,
      [check_in, check_out, attendance_status, id]
    );
    
    res.json({
      success: true,
      message: 'Attendance updated successfully'
    });
    
  } catch (err) {
    console.error('updateAttendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: err.message
    });
  }
};

// DELETE ATTENDANCE
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if attendance exists
    const [exists] = await db.query(
      'SELECT attendance_id FROM attendance WHERE attendance_id = ?',
      [id]
    );
    
    if (exists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Delete attendance
    await db.query(
      'DELETE FROM attendance WHERE attendance_id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Attendance deleted successfully'
    });
    
  } catch (err) {
    console.error('deleteAttendance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance',
      error: err.message
    });
  }
};

// GET TODAY'S ATTENDANCE COUNT
const getTodayAttendanceCount = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM attendance 
       WHERE attendance_date = ?
       AND attendance_status = 'Present'`,
      [today]
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getTodayAttendanceCount
};
