const db = require("../db"); 

// TEST ENDPOINT - Simple health check
exports.testDepartments = async (req, res) => {
  try {
    console.log("=== TEST DEPARTMENTS ENDPOINT ===");
    
    // Test basic database connection
    const result = await db.query("SELECT 'API is working' as message, NOW() as timestamp");
    
    res.status(200).json({
      success: true,
      message: "Departments API is working",
      database: "Connected",
      timestamp: result[0][0].timestamp
    });
    
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "API test failed",
      error: error.message
    });
  }
};

// GET ALL DEPARTMENTS with pagination and search
exports.getDepartments = async (req, res) => {
  try {
    console.log("=== DEPARTMENTS API CALLED ===");
    console.log("Query params:", req.query);
    
    // Test database connection first
    try {
      const testResult = await db.query("SELECT 1 as test");
      console.log("Database connection OK:", testResult);
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        details: dbError.message
      });
    }
    
    // Check if departments table exists by trying to describe it
    try {
      const tableStructure = await db.query("DESCRIBE departments");
      console.log("Departments table structure:", tableStructure);
    } catch (tableError) {
      console.error("Departments table doesn't exist:", tableError);
      return res.status(500).json({
        success: false,
        message: "Departments table not found",
        details: "The departments table doesn't exist in the database. Please create it first.",
        sqlError: tableError.message
      });
    }
    
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    console.log("Parsed params:", { page, limit, search });
    
    // Validate inputs
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    
    let query = "SELECT dept_id, dept_name, location, budget FROM departments";
    let params = [];
    
    if (search && search.trim() !== "") {
      query += " WHERE dept_name LIKE ? OR location LIKE ?";
      const searchTerm = `%${search.trim()}%`;
      params = [searchTerm, searchTerm];
    }
    
    query += " ORDER BY dept_id";
    
    console.log("Final query:", query);
    console.log("Query params:", params);
    
    const [departments] = await db.query(query, params);
    
    console.log("Query result:", departments);
    
    // Apply pagination
    const totalCount = departments.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = departments.slice(startIndex, startIndex + limit);
    
    const response = {
      success: true,
      data: paginatedResults,
      page: page,
      totalPages: totalPages,
      totalCount: totalCount
    };
    
    console.log("Sending response:", response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error("=== MAJOR ERROR IN DEPARTMENTS ===");
    console.error("Full error:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("SQL State:", error.sqlState);
    console.error("SQL Message:", error.sqlMessage);
    console.error("Query params that caused error:", req.query);
    
    res.status(500).json({
      success: false,
      message: "Server error occurred",
      details: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
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

