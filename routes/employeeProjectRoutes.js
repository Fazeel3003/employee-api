const express = require("express");
const router = express.Router();
const controller = require("../controllers/employeeProjectController");

router.post("/", controller.assignEmployeeToProject);
router.get("/", controller.getAllAssignments);
router.get("/employee/:id", controller.getEmployeeProjects);
router.get("/project/:id", controller.getProjectEmployees);
router.put("/:id", controller.updateAssignment);
router.delete("/:id", controller.deleteAssignment);

module.exports = router;
