const db = require("../db");

// Mark attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { emp_id, attendance_date, check_in, check_out, attendance_status } = req.body;

    const [result] = await db.query(
      `INSERT INTO attendance 
       (emp_id, attendance_date, check_in, check_out, attendance_status)
       VALUES (?, ?, ?, ?, ?)`,
      [emp_id, attendance_date, check_in, check_out, attendance_status]
    );

    res.status(201).json({
      success: true,
      message: "Attendance marked",
      attendanceId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// Get attendance by employee
exports.getAttendanceByEmployee = async (req, res, next) => {
  try {
    const empId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE emp_id = ?",
      [empId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

// Update attendance
exports.updateAttendance = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { check_in, check_out, attendance_status } = req.body;

    const [result] = await db.query(
      `UPDATE attendance 
       SET check_in = ?, check_out = ?, attendance_status = ?
       WHERE attendance_id = ?`,
      [check_in, check_out, attendance_status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated"
    });

  } catch (error) {
    next(error);
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res, next) => {
  try {
    const id = req.params.id;

    await db.query(
      "DELETE FROM attendance WHERE attendance_id = ?",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Attendance deleted"
    });

  } catch (error) {
    next(error);
  }
};