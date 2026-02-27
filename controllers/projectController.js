const db = require("../db");

// ✅ GET ALL PROJECTS
exports.getAllProjects = async (req, res, next) => {
  try {
    const [projects] = await db.query("SELECT * FROM projects");

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
      status
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO projects 
       (project_name, start_date, end_date, status)
       VALUES (?, ?, ?, ?)`,   
      [project_name, start_date, end_date, status]
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      projectId: result.insertId
    });

  } catch (error) {
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
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE projects SET
        project_name = ?,
        start_date = ?,
        end_date = ?,
        status = ?
       WHERE project_id = ?`,
      [project_name, start_date, end_date, status, id]
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
