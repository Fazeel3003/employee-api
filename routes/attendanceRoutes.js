const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getTodayAttendanceCount
} = require('../controllers/attendanceController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

// ADMIN, HR only - all attendance records
router.get('/', verifyToken, (req, res, next) => {
  const role = req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.MANAGER) {
    req.filterByManager = true; // controller will filter by dept
    return next();
  }
  if (role === ROLES.USER) {
    req.filterByUser = true; // controller will filter by userId
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied' });
}, getAllAttendance);

// MANAGER - team attendance only (filter by manager's department)
router.get('/team', verifyToken, verifyRole([ROLES.MANAGER]), getAllAttendance);

// USER - own attendance only
router.get('/me', verifyToken, verifyRole([ROLES.USER]), getAllAttendance);

// ADMIN, HR, MANAGER - create attendance
router.post('/', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), createAttendance);

// ADMIN, HR, MANAGER - update attendance
router.put('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), updateAttendance);

// ADMIN, HR, MANAGER - delete attendance
router.delete('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), deleteAttendance);

// Specific route for today's count
router.get('/today/count', verifyToken, getTodayAttendanceCount);

// MANAGER - get team members for attendance dropdown
router.get('/team-employees', verifyToken, verifyRole([ROLES.MANAGER]), async (req, res) => {
  try {
    const db = require('../db');
    const [rows] = await db.query(
      `SELECT emp_id, first_name, last_name, employee_code 
       FROM employees 
       WHERE manager_id = (
         SELECT emp_id FROM employees WHERE email = ?
       )`,
      [req.user.email]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;