const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Verify JWT Token Middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if token starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Expected "Bearer <token>".'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'employee-management-system',
      audience: 'employee-management-users'
    });

    // Add user info to request object
    req.user = decoded;
    req.token = token;

    next();

  } catch (error) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed.',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

/**
 * Verify User Role Middleware
 * @param {string|Array} requiredRoles - Required role(s) to access the resource
 * @returns {Function} - Express middleware function
 */
const verifyRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      // Ensure requiredRoles is an array
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Get user role from request (set by verifyToken middleware)
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. User role not found.',
          code: 'ROLE_NOT_FOUND'
        });
      }

      // Check if user has required role
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}. Current role: ${userRole}.`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole: userRole
        });
      }

      // Add role info to request for further use
      req.userRoles = roles;
      req.hasRequiredRole = true;

      next();

    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification.',
        code: 'ROLE_VERIFICATION_ERROR'
      });
    }
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user info to request if token is valid, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'employee-management-system',
      audience: 'employee-management-users'
    });

    req.user = decoded;
    req.token = token;
    req.isAuthenticated = true;

    next();

  } catch (error) {
    // Token is invalid/expired, but we continue without authentication
    // This is useful for endpoints that work with or without auth
    next();
  }
};

/**
 * Check if user is accessing their own resource
 * @param {string} resourceUserIdField - Field name containing user ID in the resource
 */
const checkOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    try {
      const currentUserId = req.user?.userId;
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

      // Admin can access any resource
      if (req.user?.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      if (currentUserId && currentUserId === parseInt(resourceUserId)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        code: 'RESOURCE_ACCESS_DENIED'
      });

    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during ownership check.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  verifyToken,
  verifyRole,
  optionalAuth,
  checkOwnership
};
