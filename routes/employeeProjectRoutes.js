const express = require('express');
const router = express.Router();
const {
  getAllEmployeeProjects,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require('../controllers/employeeProjectController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllEmployeeProjects);
router.post('/', verifyToken, createAssignment);
router.put('/:id', verifyToken, updateAssignment);
router.delete('/:id', verifyToken, deleteAssignment);

module.exports = router;
