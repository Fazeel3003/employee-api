const express = require("express");
const router = express.Router();
const controller = require("../controllers/attendanceController");

router.post("/", controller.markAttendance);
router.get("/employee/:id", controller.getAttendanceByEmployee);
router.put("/:id", controller.updateAttendance);
router.delete("/:id", controller.deleteAttendance);

module.exports = router;