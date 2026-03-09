const db = require("../db");

// GET ALL POSITIONS with pagination and search
exports.getPositions = async (req, res) => {
  try {
    console.log("=== Positions API Called ===");
    console.log("Query params:", req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    console.log("Parsed params:", { page, limit, search });

    // Validate inputs
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    
    let allRows = [];
    
    // Try different query approaches to handle potential schema issues
    try {
      if (search && search.trim() !== "") {
        // First try: Search only in position_title (most likely to be string)
        console.log("Trying search in position_title only...");
        const searchTerm = `%${search.trim()}%`;
        const [searchResults] = await db.query(
          "SELECT * FROM positions WHERE position_title LIKE ?", 
          [searchTerm]
        );
        allRows = searchResults;
        console.log("Position title search found:", allRows.length, "rows");
        
        // If no results, try department field
        if (allRows.length === 0) {
          console.log("Trying search in department only...");
          const [deptResults] = await db.query(
            "SELECT * FROM positions WHERE department LIKE ?", 
            [searchTerm]
          );
          allRows = deptResults;
          console.log("Department search found:", allRows.length, "rows");
        }
      } else {
        // No search - get all positions
        console.log("Getting all positions (no search)...");
        const [allResults] = await db.query("SELECT * FROM positions");
        allRows = allResults;
        console.log("All positions query found:", allRows.length, "rows");
      }
    } catch (dbError) {
      console.error("=== DATABASE QUERY ERROR ===");
      console.error("Database error:", dbError);
      console.error("SQL Error Code:", dbError.code);
      console.error("SQL Error Message:", dbError.message);
      console.error("SQL Error Details:", dbError.sqlMessage);
      
      // Try fallback: Get all positions and filter in JavaScript
      console.log("Trying fallback: Get all positions and filter in JS...");
      try {
        const [fallbackResults] = await db.query("SELECT * FROM positions");
        allRows = fallbackResults;
        
        if (search && search.trim() !== "") {
          const searchTerm = search.trim().toLowerCase();
          allRows = allRows.filter(row => {
            try {
              return (
                (row.position_title && row.position_title.toLowerCase().includes(searchTerm)) ||
                (row.department && row.department.toLowerCase().includes(searchTerm))
              );
            } catch (filterError) {
              console.error("Filter error for row:", row, filterError);
              return false;
            }
          });
        }
        console.log("Fallback filtering found:", allRows.length, "rows");
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        throw fallbackError;
      }
    }
    
    // Validate results
    if (!Array.isArray(allRows)) {
      console.error("Invalid query result:", allRows);
      return res.status(500).json({
        success: false,
        message: "Database query returned invalid results",
        details: "Expected array but got " + typeof allRows
      });
    }
    
    // Apply pagination in JavaScript
    const totalCount = allRows.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRows = allRows.slice(startIndex, endIndex);
    
    console.log("Pagination applied:", { 
      totalCount, 
      totalPages, 
      page, 
      startIndex, 
      endIndex, 
      returnedRows: paginatedRows.length 
    });

    const response = {
      success: true,
      data: paginatedRows,
      page: page,
      totalPages: totalPages,
      totalCount: totalCount
    };
    
    console.log("Sending response:", response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error("=== MAJOR ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    console.error("Query params that caused error:", req.query);
    
    res.status(500).json({
      success: false,
      message: "Server error occurred",
      details: error.message,
      query: req.query,
      stack: error.stack
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
