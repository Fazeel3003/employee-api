const db = require("../db.js"); 

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
