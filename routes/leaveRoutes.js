const express = require("express");
const router = express.Router();
const controller = require("../controllers/leaveController");
const { verifyToken, verifyRole, checkOwnership } = require("../middleware/authMiddleware");
const { ROLES } = require("../constants/roles");

// Apply authentication to all leave routes
router.use(verifyToken);

// ALL ROLES - get leave requests with role-based filtering
router.get("/", (req, res, next) => {
  const role = req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.MANAGER) {
    req.filterByManager = true;
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
}, controller.getAllLeaveRequests);

// MANAGER - get team leave requests only
router.get("/team", verifyRole([ROLES.MANAGER]), controller.getAllLeaveRequests);

// USER - get own leave requests only
router.get("/me", verifyRole([ROLES.USER]), checkOwnership('id'), controller.getAllLeaveRequests);

// ALL ROLES - apply for leave
router.post("/", controller.applyLeave);

// ADMIN, HR, MANAGER - approve leave
router.put("/:id/approve", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), controller.approveLeave);

// ADMIN, HR, MANAGER - reject leave
router.put("/:id/reject", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), controller.rejectLeave);

// ADMIN, HR, USER, MANAGER - update leave status with ownership check
router.put("/:id", (req, res, next) => {
  const role = req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.USER || role === ROLES.MANAGER) {
    req.checkOwnershipForEdit = true;
    return next();
  }
  return res.status(403).json({ 
    success: false, message: 'Access denied' 
  });
}, controller.updateLeaveStatus);

// ADMIN, HR, USER - delete leave with ownership check
router.delete("/:id", (req, res, next) => {
  const role = req.user?.role;
  if (role === ROLES.ADMIN || role === ROLES.HR) return next();
  if (role === ROLES.USER) {
    req.checkOwnershipForDelete = true;
    return next();
  }
  return res.status(403).json({ 
    success: false, message: 'Access denied' 
  });
}, controller.deleteLeave);

// Get pending leave count
router.get("/pending/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), controller.getPendingLeaveCount);

module.exports = router;
