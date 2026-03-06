const express = require("express");
const router = express.Router();
const controller = require("../controllers/leaveController");

// Apply leave
router.post("/", controller.applyLeave);

// Get all leave requests with pagination and filtering
router.get("/", controller.getAllLeaveRequests);

// Get leave by employee
router.get("/employee/:id", controller.getLeaveByEmployee);

// Update leave
router.put("/:id", controller.updateLeaveStatus);

// Approve leave
router.put("/:id/approve", controller.approveLeave);

// Reject leave  
router.put("/:id/reject", controller.rejectLeave);

// Delete leave
router.delete("/:id", controller.deleteLeave);

module.exports = router;
