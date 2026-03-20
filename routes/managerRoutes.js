const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { verifyToken, authorizeRoles, managerTeamAccess } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/manager/team
 * @desc    Get manager's team members
 * @access  Private (Manager, Admin)
 */
router.get('/team', 
  verifyToken, 
  authorizeRoles('admin', 'manager'), 
  managerTeamAccess, 
  managerController.getTeamMembers
);

/**
 * @route   GET /api/v1/manager/team-attendance
 * @desc    Get team attendance records
 * @access  Private (Manager, Admin)
 */
router.get('/team-attendance', 
  verifyToken, 
  authorizeRoles('admin', 'manager'), 
  managerTeamAccess, 
  managerController.getTeamAttendance
);

/**
 * @route   GET /api/v1/manager/team-leaves
 * @desc    Get team leave requests
 * @access  Private (Manager, Admin)
 */
router.get('/team-leaves', 
  verifyToken, 
  authorizeRoles('admin', 'manager'), 
  managerTeamAccess, 
  managerController.getTeamLeaveRequests
);

/**
 * @route   PUT /api/v1/manager/leave-requests/:id/approve
 * @desc    Approve or reject leave request
 * @access  Private (Manager, Admin)
 */
router.put('/leave-requests/:id/approve', 
  verifyToken, 
  authorizeRoles('admin', 'manager'), 
  managerTeamAccess, 
  managerController.approveLeaveRequest
);

/**
 * @route   GET /api/v1/manager/team-projects
 * @desc    Get team projects
 * @access  Private (Manager, Admin)
 */
router.get('/team-projects', 
  verifyToken, 
  authorizeRoles('admin', 'manager'), 
  managerTeamAccess, 
  managerController.getTeamProjects
);

/**
 * @route   POST /api/v1/manager/project-assignment
 * @desc    Assign employee to project
 * @access  Private (Manager, Admin)
 */
router.post('/project-assignment', 
  verifyToken, 
  authorizeRoles('admin', 'manager'), 
  managerTeamAccess, 
  managerController.assignToProject
);

module.exports = router;
