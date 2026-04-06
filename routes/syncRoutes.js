// routes/syncRoutes.js
// Admin-only routes for data synchronization

const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../constants/roles');
const { syncAllUsers } = require('../services/userEmployeeSync');

// Apply authentication to all sync routes
router.use(verifyToken);
router.use(verifyRole([ROLES.ADMIN]));

/**
 * @route   POST /api/v1/sync/users-to-employees
 * @desc    Sync all users without employee records
 * @access  Admin only
 */
router.post('/users-to-employees', async (req, res) => {
  try {
    const results = await syncAllUsers();
    
    res.status(200).json({
      success: true,
      message: 'User-employee sync completed',
      data: results
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync users to employees',
      error: error.message
    });
  }
});

module.exports = router;
