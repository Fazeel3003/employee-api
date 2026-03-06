const express = require("express");
const router = express.Router();
const controller = require("../controllers/salaryController");

// Add salary record
router.post("/", controller.addSalaryRecord);

// Get all salary records with pagination and filtering
router.get("/", controller.getAllSalaryHistory);

// Get salary by employee
router.get("/employee/:id", controller.getSalaryByEmployee);

// Get salary by ID
router.get("/:id", controller.getSalaryById);

// Update salary record
router.put("/:id", controller.updateSalaryRecord);

// Delete salary record
router.delete("/:id", controller.deleteSalaryRecord);

module.exports = router;
