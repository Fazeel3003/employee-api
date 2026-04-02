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

// ALL ROLES - all attendance records with role-based filtering
router.get('/', verifyToken, (req, res, next) => {
  const role = req.user?.role;
  console.log("Attendance route - User role:", role);
  
  // Normalize role for backward compatibility
  const normalizeRole = (role) => {
    if (role === "user") return "employee";
    return role;
  };
  
  const normalizedRole = normalizeRole(role);
  console.log("Attendance route - Normalized role:", normalizedRole);
  
  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.HR) return next();
  if (normalizedRole === ROLES.MANAGER) {
    req.filterByManager = true; // controller will filter by dept
    return next();
  }
  if (normalizedRole === ROLES.USER) {
    req.filterByUser = true; // controller will filter by userId
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied',
    role: normalizedRole,
    allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.USER]
  });
}, getAllAttendance);

// MANAGER - team attendance only (filter by manager's department)
router.get('/team', verifyToken, verifyRole([ROLES.MANAGER]), getAllAttendance);

// USER - own attendance only
router.get('/me', verifyToken, verifyRole([ROLES.USER]), getAllAttendance);
router.get('/my/month', verifyToken, verifyRole([ROLES.USER]), getAllAttendance);

// ADMIN, HR only - create attendance
router.post('/', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR]), createAttendance);

// ADMIN, HR only - update attendance
router.put('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR]), updateAttendance);

// ADMIN, HR only - delete attendance
router.delete('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR]), deleteAttendance);

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