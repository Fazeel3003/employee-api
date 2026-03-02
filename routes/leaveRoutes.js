const express = require("express");
const router = express.Router();
const controller = require("../controllers/leaveController");

router.post("/", controller.applyLeave);
router.get("/employee/:id", controller.getLeaveByEmployee);
router.put("/:id", controller.updateLeaveStatus);

module.exports = router;