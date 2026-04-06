// services/userEmployeeSync.js
// Helper service to maintain sync between users and employees tables

const db = require('../db');

/**
 * Create employee record for a new user
 * @param {Object} userData - User data from registration
 * @returns {Promise<Object>} Created employee record
 */
async function createEmployeeForUser(userData) {
  const { userId, name, email, role } = userData;

  // Only create employee record for employee role
  if (role !== 'employee') {
    return null;
  }

  try {
    // Generate employee code
    const [maxRow] = await db.query('SELECT MAX(emp_id) as maxId FROM employees');
    const nextId = (maxRow[0].maxId || 0) + 1;
    const year = new Date().getFullYear();
    const employee_code = `EMP-${year}-${String(nextId).padStart(3, '0')}`;

    // Split name into first_name and last_name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || nameParts[0];

    // Create employee record
    const [result] = await db.query(
      `INSERT INTO employees 
       (employee_code, first_name, last_name, email, hire_date, status, user_id) 
       VALUES (?, ?, ?, ?, CURDATE(), 'Active', ?)`,
      [employee_code, first_name, last_name, email, userId]
    );

    return {
      emp_id: result.insertId,
      employee_code,
      first_name,
      last_name,
      email
    };
  } catch (error) {
    console.error('Error creating employee record:', error);
    throw error;
  }
}

/**
 * Check if user has employee record
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
async function hasEmployeeRecord(email) {
  const [rows] = await db.query(
    'SELECT emp_id FROM employees WHERE email = ?',
    [email]
  );
  return rows.length > 0;
}

/**
 * Get employee record by user email
 * @param {string} email - User email
 * @returns {Promise<Object|null>}
 */
async function getEmployeeByEmail(email) {
  const [rows] = await db.query(
    'SELECT * FROM employees WHERE email = ?',
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Sync all users without employee records
 * @returns {Promise<Object>} Sync results
 */
async function syncAllUsers() {
  try {
    // Get users without employee records
    const [users] = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at
      FROM users u
      LEFT JOIN employees e ON u.email = e.email
      WHERE e.emp_id IS NULL AND u.role = 'employee'
    `);

    const results = {
      total: users.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        await createEmployeeForUser({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing users:', error);
    throw error;
  }
}

module.exports = {
  createEmployeeForUser,
  hasEmployeeRecord,
  getEmployeeByEmail,
  syncAllUsers
};
