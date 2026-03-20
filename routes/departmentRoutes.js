const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const { ROLES } = require("../constants/roles");

// Apply authentication to all department routes
router.use(verifyToken);

// ADMIN, HR, MANAGER - get department count
router.get("/count", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), departmentController.getDepartmentCount);

// ADMIN, HR, MANAGER - get all departments
router.get("/", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), departmentController.getDepartments);

// ADMIN, HR, MANAGER - get department by ID
router.get("/:id", verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), departmentController.getDepartmentById);

// ADMIN, HR - create department
router.post("/", verifyRole([ROLES.ADMIN, ROLES.HR]), departmentController.createDepartment);

// ADMIN, HR - update department
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), departmentController.updateDepartment);

// ADMIN, HR - delete department
router.delete("/:id", verifyRole([ROLES.ADMIN, ROLES.HR]), departmentController.deleteDepartment);

module.exports = router;
