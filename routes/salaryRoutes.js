const express = require("express");
const router = express.Router();
const controller = require("../controllers/salaryController");
const { verifyToken, verifyRole, checkOwnership } = require("../middleware/authMiddleware");
const { ROLES } = require("../constants/roles");

// Apply authentication to all salary routes
router.use(verifyToken);

// ADMIN, HR - get salary stats
router.get("/total", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.getTotalSalary);
router.get("/count", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.getSalaryCount);

// ALL ROLES - get salary records with role-based filtering
router.get("/", (req, res, next) => {
  const role = req.user?.role;
  console.log("Salary history route - User role:", role);

  const normalizeRole = (role) => {
    if (role === "user") return "employee";
    return role;
  };

  const normalizedRole = normalizeRole(role);
  console.log("Salary history route - Normalized role:", normalizedRole);

  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.HR) return next();
  if (normalizedRole === ROLES.MANAGER) {
    req.filterByManager = true;
    return next();
  }
  if (normalizedRole === ROLES.USER) { // ROLES.USER is now 'employee'
    req.filterByUser = true;
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied',
    role: normalizedRole,
    allowedRoles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.USER]
  });
}, controller.getAllSalaryHistory);

// USER, MANAGER - get own salary only
router.get("/me", (req, res, next) => {
  const role = req.user?.role;
  console.log("Salary /me route - User role:", role);

  const normalizeRole = (role) => {
    if (role === "user") return "employee";
    return role;
  };

  const normalizedRole = normalizeRole(role);
  console.log("Salary /me route - Normalized role:", normalizedRole);

  if (normalizedRole === ROLES.USER || normalizedRole === ROLES.MANAGER) {
    req.filterByUser = true;
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied',
    role: normalizedRole,
    allowedRoles: [ROLES.USER, ROLES.MANAGER]
  });
}, controller.getAllSalaryHistory);

// ADMIN, HR - create salary record
router.post("/", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.addSalaryRecord);

// ADMIN, HR - update salary record
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.updateSalaryRecord);

// ADMIN, HR - delete salary record
router.delete("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.deleteSalaryRecord);

module.exports = router;
