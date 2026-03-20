const validateEmployee = require("../middleware/validateEmployee");
const { verifyToken, verifyRole, checkOwnership } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { ROLES } = require("../constants/roles");
const db = require('../db');

// Apply authentication to all employee routes
router.use(verifyToken);

// ADMIN, HR, MANAGER - get employee stats
router.get("/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getEmployeeCount);
router.get("/managers", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getManagers);
router.get("/new-hires/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getNewHiresCount);
router.get("/active", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getActiveEmployees);

// ADMIN, HR, MANAGER - get all employees
router.get("/", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), employeeController.getAllEmployees);

// ALL AUTHENTICATED USERS - get own employee record
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM employees WHERE email = ?`,
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee record',
      error: err.message
    });
  }
});

// MANAGER - get team members only
router.get("/team", verifyToken, verifyRole([ROLES.MANAGER]), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT emp_id, employee_code, first_name, last_name, 
              email, phone, dept_id, position_id, status
       FROM employees 
       WHERE manager_id = (
         SELECT emp_id FROM employees WHERE email = ?
       )`,
      [req.user.email]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ 
      success: false, message: err.message 
    });
  }
});

// ADMIN, HR, MANAGER, USER (own only) - get employee by ID
router.get("/:id", 
  verifyToken,
  employeeController.getEmployeeById
);

// ADMIN, HR - create employee
router.post("/", verifyRole([ROLES.ADMIN, ROLES.HR]), validateEmployee, employeeController.createEmployee);

// ADMIN, HR - update employee
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), validateEmployee, employeeController.updateEmployee);

// ADMIN only - delete employee
router.delete("/:id", verifyRole([ROLES.ADMIN]), employeeController.deleteEmployee);

module.exports = router;
