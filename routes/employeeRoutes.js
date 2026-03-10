const validateEmployee = require("../middleware/validateEmployee");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

// Apply authentication to all employee routes
router.use(verifyToken);

// Public routes (with authentication)
router.get("/", verifyRole(['admin', 'manager']), employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);

// Protected routes (with role-based access)
router.post("/", verifyRole(['admin']), validateEmployee, employeeController.createEmployee);
router.put("/:id", verifyRole(['admin']), validateEmployee, employeeController.updateEmployee);
router.delete("/:id", verifyRole(['admin']), employeeController.deleteEmployee);

module.exports = router;
