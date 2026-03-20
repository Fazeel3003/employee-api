const db = require("../db");

// GET ALL ASSIGNMENTS
const getAllEmployeeProjects = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ep.assignment_id,
        ep.emp_id,
        ep.project_id,
        ep.role_name,
        ep.allocation_percent,
        ep.assigned_on,
        ep.released_on,
        e.first_name,
        e.last_name,
        e.employee_code,
        e.status as employee_status,
        p.project_name,
        p.status as project_status
       FROM employee_projects ep
       INNER JOIN employees e 
         ON ep.emp_id = e.emp_id
       INNER JOIN projects p 
         ON ep.project_id = p.project_id
       ORDER BY ep.assignment_id DESC`
    );
    
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('getAllEmployeeProjects error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: err.message
    });
  }
};

// CREATE ASSIGNMENT
const createAssignment = async (req, res) => {
  try {
    const {
      emp_id,
      project_id,
      role_name,
      allocation_percent,
      assigned_on,
      released_on
    } = req.body;

    // Validate required fields
    if (!emp_id || !project_id || !role_name || !assigned_on) {
      return res.status(400).json({
        success: false,
        message: 'emp_id, project_id, role_name and assigned_on are required'
      });
    }

    // Insert with EXACT column names
    const [result] = await db.query(
      `INSERT INTO employee_projects
        (emp_id, project_id, role_name, allocation_percent, assigned_on, released_on)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        emp_id,
        project_id,
        role_name,
        allocation_percent || 100.00,
        assigned_on,
        released_on || null
      ]
    );

    // Fetch created assignment with names
    const [newAssignment] = await db.query(
      `SELECT 
        ep.assignment_id,
        ep.emp_id,
        ep.project_id,
        ep.role_name,
        ep.allocation_percent,
        ep.assigned_on,
        ep.released_on,
        e.first_name,
        e.last_name,
        e.employee_code,
        p.project_name,
        p.status as project_status
       FROM employee_projects ep
       INNER JOIN employees e 
         ON ep.emp_id = e.emp_id
       INNER JOIN projects p 
         ON ep.project_id = p.project_id
       WHERE ep.assignment_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Employee assigned successfully',
      data: newAssignment[0]
    });

  } catch (err) {
    console.error('createAssignment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: err.message
    });
  }
};

// UPDATE ASSIGNMENT
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      emp_id,
      project_id,
      role_name,
      allocation_percent,
      assigned_on,
      released_on
    } = req.body;

    await db.query(
      `UPDATE employee_projects SET
        emp_id = ?,
        project_id = ?,
        role_name = ?,
        allocation_percent = ?,
        assigned_on = ?,
        released_on = ?
       WHERE assignment_id = ?`,
      [
        emp_id,
        project_id,
        role_name,
        allocation_percent || 100.00,
        assigned_on,
        released_on || null,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully'
    });

  } catch (err) {
    console.error('updateAssignment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: err.message
    });
  }
};

// DELETE ASSIGNMENT
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM employee_projects
       WHERE assignment_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment removed successfully'
    });

  } catch (err) {
    console.error('deleteAssignment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: err.message
    });
  }
};

module.exports = {
  getAllEmployeeProjects,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
