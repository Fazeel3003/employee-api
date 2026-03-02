const express = require("express");
const router = express.Router();
const controller = require("../controllers/salaryController");

router.post("/", controller.addSalaryRecord);
router.get("/employee/:id", controller.getSalaryByEmployee);
router.put("/:id", controller.updateSalaryRecord);
router.delete("/:id", controller.deleteSalaryRecord);

module.exports = router;