const express = require('express');
const router = express.Router();
const {
  getAllEmployeeProjects,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/employeeProjectController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');

router.get('/', verifyToken, getAllEmployeeProjects);
router.post('/', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), createAssignment);
router.put('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), updateAssignment);
router.delete('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]), deleteAssignment);

module.exports = router;
