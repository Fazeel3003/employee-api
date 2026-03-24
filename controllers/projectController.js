const db = require("../db");

// ✅ GET ALL PROJECTS
exports.getAllProjects = async (req, res, next) => {
  try {
    let whereClause = '';
    let params = [];

    // Check if user is Manager and filter by their managed projects + team assignments
    if (req.filterByManager) {
      const [mgrRows] = await db.query(
        'SELECT emp_id FROM employees WHERE email = ?',
        [req.user.email]
      );
      
      if (mgrRows.length === 0) {
        return res.json({ 
          success: true, count: 0, data: [] 
        });
      }
      
      const managerEmpId = mgrRows[0].emp_id;  
      whereClause = `WHERE p.project_id IN (
        SELECT DISTINCT project_id 
        FROM projects 
        WHERE project_manager_id = ?
        
        UNION
        
        SELECT DISTINCT ep.project_id
        FROM employee_projects ep
        INNER JOIN employees e ON ep.emp_id = e.emp_id
        WHERE e.manager_id = ?
      )`;
      params = [managerEmpId, managerEmpId];
    }

    const query = whereClause 
  ? `SELECT p.* FROM projects p ${whereClause}`
  : `SELECT * FROM projects`;
    const [projects] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// ✅ GET PROJECT BY ID
exports.getProjectById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    next(error);
  }
};

// ✅ CREATE PROJECT
exports.createProject = async (req, res, next) => {
  try {
    
    const {
      project_name,
      start_date,
      end_date,
      budget,
      status,
      project_manager_id
    } = req.body;


    const [result] = await db.query(
      `INSERT INTO projects 
       (project_name, start_date, end_date, budget, status, project_manager_id)
       VALUES (?, ?, ?, ?, ?, ?)`,   
      [project_name, start_date, end_date, budget, status, project_manager_id]
    );


    res.status(201).json({
      success: true,
      message: "Project created successfully",
      projectId: result.insertId
    });

  } catch (error) {
    console.error("Database error in createProject:", error);
    console.error("SQL Error details:", error.sqlMessage);
    next(error);
  }
};


// ✅ UPDATE PROJECT
exports.updateProject = async (req, res, next) => {
  try {
    const id = req.params.id;

    const {
      project_name,
      start_date,
      end_date,
      budget,
      status,
      project_manager_id
    } = req.body;


    const [result] = await db.query(
      `UPDATE projects SET
        project_name = ?,
        start_date = ?,
        end_date = ?,
        budget = ?,
        status = ?,
        project_manager_id = ?
       WHERE project_id = ?`,
      [project_name, start_date, end_date, budget, status, project_manager_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully"
    });

  } catch (error) {
    console.error("Database error in updateProject:", error);
    console.error("SQL Error details:", error.sqlMessage);
    next(error);
  }
};

// ✅ DELETE PROJECT
exports.deleteProject = async (req, res, next) => {
  try {
    const id = req.params.id;

    const [result] = await db.query(
      "DELETE FROM projects WHERE project_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};

// GET PROJECT COUNT
exports.getProjectCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM projects`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

// GET ACTIVE PROJECT COUNT
exports.getActiveProjectCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM projects 
       WHERE status = 'In Progress'`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};

// GET COMPLETED PROJECTS COUNT
exports.getCompletedProjectsCount = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM projects 
       WHERE status = 'Completed'`
    );
    
    res.json({ count: rows[0].count });
  } catch (error) {
    next(error);
  }
};
