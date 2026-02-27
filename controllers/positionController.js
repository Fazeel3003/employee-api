const db = require("../db");

exports.getPositions = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM positions");

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM positions WHERE position_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Create Position
exports.createPosition = async (req, res) => {
  try {
    const { position_title, min_salary, max_salary, dept_id } = req.body;

    if (!position_title || !dept_id) {
      return res.status(400).json({
        success: false,
        message: "Position title and department ID are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO positions 
       (position_title, min_salary, max_salary, dept_id) 
       VALUES (?, ?, ?, ?)`,
      [position_title, min_salary, max_salary, dept_id]
    );

    res.status(201).json({
      success: true,
      message: "Position created successfully",
      position_id: result.insertId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Update Position
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { position_title, min_salary, max_salary, dept_id } = req.body;

    const [result] = await db.query(
      `UPDATE positions 
       SET position_title = ?, min_salary = ?, max_salary = ?, dept_id = ?
       WHERE position_id = ?`,
      [position_title, min_salary, max_salary, dept_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    res.json({
      success: true,
      message: "Position updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Delete Position
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM positions WHERE position_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    res.json({
      success: true,
      message: "Position deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
