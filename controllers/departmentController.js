const db = require("../db"); 

// GET ALL DEPARTMENTS
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT dept_id, dept_name, location, budget FROM departments"
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//Department get by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM departments WHERE dept_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
  try {
    const { dept_name, location, budget } = req.body;

    if (!dept_name) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const [result] = await db.query(
      "INSERT INTO departments (dept_name, location, budget) VALUES (?, ?, ?)",
      [dept_name, location, budget]
    );

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      dept_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//Update Department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { dept_name, location, budget } = req.body;

    const [result] = await db.query(
      `UPDATE departments 
       SET dept_name = ?, location = ?, budget = ?
       WHERE dept_id = ?`,
      [dept_name, location, budget, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      message: "Department updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//Delete Department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM departments WHERE dept_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

