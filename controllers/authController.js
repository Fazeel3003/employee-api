const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { createEmployeeForUser } = require('../services/userEmployeeSync');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/*
 * JWT PAYLOAD STANDARD:
 * Always sign with: { userId, email, name, role }
 * Always read with: req.user.userId
 * NEVER change these property names!
 * 
 * LOGIN:   jwt.sign({ userId: user.id, ... })
 * VERIFY:  const userId = req.user?.userId || req.user?.id || req.user?.user_id
 */

/**
 * User Registration
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // SECURITY: Always assign 'employee' role for self-registration
    // Privileged roles (admin, manager, hr) must be created by administrators
    const role = 'employee';

    // Input validation with industry-level standards
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Name validation
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    } else if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name must be less than 100 characters'
      });
    } else if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
      });
    }

    // Email validation with professional standards
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    } else if (email.trim().toLowerCase() !== email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address should not contain uppercase letters'
      });
    } else if (email.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Email address cannot contain consecutive dots'
      });
    } else if (email.startsWith('.') || email.endsWith('.')) {
      return res.status(400).json({
        success: false,
        message: 'Email address cannot start or end with a dot'
      });
    }

    // Password validation with industry-level security standards
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    } else if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be less than 128 characters'
      });
    } else {
      // Check for character types
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (!hasUpperCase) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one uppercase letter (A-Z)'
        });
      } else if (!hasLowerCase) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one lowercase letter (a-z)'
        });
      } else if (!hasNumbers) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one number (0-9)'
        });
      } else if (!hasSpecialChar) {
        return res.status(400).json({
          success: false,
          message: 'Password must contain at least one special character'
        });
      } else if (/^(.)\1{2,}/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password cannot contain more than 2 consecutive identical characters'
        });
      } else if (password.toLowerCase().includes('password') || 
                 password.toLowerCase().includes('123456') ||
                 password.toLowerCase().includes('qwerty')) {
        return res.status(400).json({
          success: false,
          message: 'Password cannot contain common patterns like "password", "123456", or "qwerty"'
        });
      } else if (email.toLowerCase().split('@')[0] && 
                 password.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
        return res.status(400).json({
          success: false,
          message: 'Password cannot contain your email username'
        });
      }
    }

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await db.query(
      `INSERT INTO users (name, email, password, role, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
      [name, email, hashedPassword, role]
    );

    // Auto-create employee record for employee role
    if (role === 'employee') {
      try {
        await createEmployeeForUser({
          userId: result.insertId,
          name,
          email,
          role
        });
      } catch (empError) {
        console.error('Error creating employee record:', empError);
        // Don't fail signup if employee creation fails - log for manual fix
      }
    }

    // Log registration event
    await logAuditEvent(result.insertId, 'REGISTER', 'user', result.insertId, clientIP, userAgent, {
      name,
      email,
      role,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: result.insertId,
        name,
        email,
        role,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

/**
 * User Login
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, name, email, password, role, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Log failed login attempt
      await logFailedLogin(email, clientIP, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      // Log failed login attempt
      await logFailedLogin(email, clientIP, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await logFailedLogin(email, clientIP, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
      issuer: 'employee-management-system',
      audience: 'employee-management-users'
    });

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d' }
    );

    // Store refresh token in database
    await storeRefreshToken(user.id, refreshToken);

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Log successful login
    await logAuditEvent(user.id, 'LOGIN', 'auth', user.id, clientIP, userAgent, {
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: userWithoutPassword,
        expiresIn: JWT_EXPIRE
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * Get Current User Profile
 * GET /api/v1/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.query(
      'SELECT id, name, email, role, status, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout (Client-side token removal)
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log logout event
    if (req.user) {
      await logAuditEvent(req.user.userId, 'LOGOUT', 'auth', req.user.userId, clientIP, userAgent, {
        email: req.user.email,
        role: req.user.role
      });
    }

    // Revoke refresh tokens for this user (optional)
    await revokeUserRefreshTokens(req.user?.userId);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove token from client storage.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

/**
 * Store refresh token in database
 */
const storeRefreshToken = async (userId, token) => {
  try {
    const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  } catch (error) {
    console.error('Error storing refresh token:', error);
    // Don't throw error to not break login flow
  }
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeUserRefreshTokens = async (userId) => {
  try {
    await db.query(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ? AND is_revoked = FALSE',
      [userId]
    );
  } catch (error) {
    console.error('Error revoking refresh tokens:', error);
  }
};

/**
 * Log failed login attempt
 */
const logFailedLogin = async (email, ipAddress, userAgent) => {
  try {
    await db.query(
      'INSERT INTO failed_login_attempts (email, ip_address, user_agent) VALUES (?, ?, ?)',
      [email, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error logging failed login:', error);
  }
};

/**
 * Log audit event
 */
const logAuditEvent = async (userId, action, resource, resourceId, ipAddress, userAgent, details = null) => {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, action, resource, resourceId, ipAddress, userAgent, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

/**
 * Get Current User Profile (for session restoration)
 * GET /api/v1/auth/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.user_id || req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Query user with employee information via email join
    const [rows] = await db.query(
      `SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u.last_login,
        u.created_at,
        COALESCE(CONCAT(e.first_name, ' ', e.last_name), u.name) AS name,
        e.phone,
        d.dept_name AS department,
        p.position_title AS position,
        e.emp_id
       FROM users u
       LEFT JOIN employees e ON u.email = e.email
       LEFT JOIN departments d ON e.dept_id = d.dept_id
       LEFT JOIN positions p ON e.position_id = p.position_id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      id: rows[0].id,
      email: rows[0].email,
      role: rows[0].role,
      status: rows[0].status,
      last_login: rows[0].last_login,
      created_at: rows[0].created_at,
      name: rows[0].name || 'N/A',
      phone: rows[0].phone || 'N/A',
      department: rows[0].department || 'N/A',
      position: rows[0].position || 'N/A',
      emp_id: rows[0].emp_id || 'N/A'
    };

    return res.status(200).json({
      success: true,
      data: userData
    });

  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: err.message
    });
  }
};

// GET ACTIVE SESSIONS COUNT
const getActiveSessionsCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM refresh_tokens
       WHERE expires_at > NOW()
       AND is_revoked = 0`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getMe,
  logout,
  getActiveSessionsCount
};
