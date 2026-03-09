const db = require("../db");

// ✅ Assign Employee to Project
exports.assignEmployeeToProject = async (req, res, next) => {
  try {
    const {
      emp_id,
      project_id,
      role_name,
      allocation_percent,
      assigned_on,
      released_on
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO employee_projects 
       (emp_id, project_id, role_name, allocation_percent, assigned_on, released_on)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        emp_id,
        project_id,
        role_name,
        allocation_percent,
        assigned_on,
        released_on
      ]
    );

    res.status(201).json({
      success: true,
      message: "Employee assigned successfully",
      assignmentId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

//All - WITH SEARCH AND PAGINATION
exports.getAllAssignments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    // Validate inputs
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    
    let query = `
      SELECT 
        ep.assignment_id,
        ep.emp_id,
        ep.project_id,
        ep.role_name,
        ep.allocation_percent,
        ep.assigned_on,
        ep.released_on,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        p.project_name as project_name
      FROM employee_projects ep
      LEFT JOIN employees e ON ep.emp_id = e.emp_id
      LEFT JOIN projects p ON ep.project_id = p.project_id
    `;
    
    let params = [];
    
    if (search && search.trim() !== "") {
      query += ` WHERE 
        e.first_name LIKE ? OR 
        e.last_name LIKE ? OR 
        p.project_name LIKE ? OR 
        ep.role_name LIKE ?
      `;
      const searchTerm = `%${search.trim()}%`;
      params = [searchTerm, searchTerm, searchTerm, searchTerm];
    }
    
    query += ` ORDER BY ep.assignment_id`;
    
    const [rows] = await db.query(query, params);
    
    // Apply pagination
    const totalCount = rows.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = rows.slice(startIndex, startIndex + limit);
    
    res.status(200).json({
      success: true,
      data: paginatedResults,
      page: page,
      totalPages: totalPages,
      totalCount: totalCount
    });

  } catch (error) {
    next(error);
  }
};

// ✅ Get All Projects of an Employee
exports.getEmployeeProjects = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    const [rows] = await db.query(
      `SELECT p.*, ep.role_name, ep.allocation_percent, ep.assigned_on, ep.released_on
       FROM projects p
       JOIN employee_projects ep ON p.project_id = ep.project_id
       WHERE ep.emp_id = ?`,
      [employeeId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

// ✅ Get All Employees in a Project
exports.getProjectEmployees = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const [rows] = await db.query(
      `SELECT e.*, ep.role_name, ep.allocation_percent, ep.assigned_on, ep.released_on
       FROM employees e
       JOIN employee_projects ep ON e.emp_id = ep.emp_id
       WHERE ep.project_id = ?`,
      [projectId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

// ✅ UPDATE Assignment
exports.updateAssignment = async (req, res, next) => {
  try {
    const id = req.params.id;

    const {
      role_name,
      allocation_percent,
      assigned_on,
      released_on
    } = req.body;

    const [result] = await db.query(
      `UPDATE employee_projects SET
        role_name = ?,
        allocation_percent = ?,
        assigned_on = ?,
        released_on = ?
       WHERE assignment_id = ?`,
      [
        role_name,
        allocation_percent,
        assigned_on,
        released_on,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment updated successfully"
    });

  } catch (error) {
    next(error);
  }
};


// ✅ Remove Assignment
exports.deleteAssignment = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(
      "DELETE FROM employee_projects WHERE assignment_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
