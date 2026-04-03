const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Input validation middleware
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['admin', 'employee', 'manager', 'hr'])
    .withMessage('Role must be one of: admin, employee, manager, hr')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access   Public
 */
router.post('/register', validateRegister, handleValidationErrors, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT token
 * @access   Public
 */
router.post('/login', validateLogin, handleValidationErrors, authController.login);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access   Private
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access   Private
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify token endpoint
 * @access  Private
 */
// Get active sessions count
router.get('/sessions/count', authController.getActiveSessionsCount);

// Get current user
router.get('/me', verifyToken, authController.getMe);

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify if token is valid
 * @access   Private
 */
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user,
      token: req.token
    }
  });
});

module.exports = router;
