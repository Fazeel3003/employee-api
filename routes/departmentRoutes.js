const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");

// Test endpoint
router.get("/test", departmentController.testDepartments);

router.get("/", departmentController.getDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.post("/", departmentController.createDepartment);
router.put("/:id", departmentController.updateDepartment);
router.delete("/:id", departmentController.deleteDepartment);

module.exports = router;
