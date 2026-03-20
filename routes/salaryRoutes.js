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
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.MANAGER) {
    req.filterByUser = true;
    return next();
  }
  if (role === ROLES.USER) {
    req.filterByUser = true;
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied' 
  });
}, controller.getAllSalaryHistory);

// USER, MANAGER - get own salary only
router.get("/me", verifyRole([ROLES.USER, ROLES.MANAGER]), checkOwnership('id'), controller.getAllSalaryHistory);

// ADMIN, HR - create salary record
router.post("/", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.addSalaryRecord);

// ADMIN, HR - update salary record
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.updateSalaryRecord);

// ADMIN, HR - delete salary record
router.delete("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), controller.deleteSalaryRecord);

module.exports = router;
