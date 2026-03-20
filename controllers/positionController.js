const db = require("../db");

// GET ALL POSITIONS
const getAllPositions = async (req, res) => {
  try {
    // Get search query if provided
    const search = req.query.search || ''
    
    let query = `
      SELECT 
        p.position_id,
        p.position_title,
        p.min_salary,
        p.max_salary,
        p.dept_id,
        d.dept_name,
        p.created_at
      FROM positions p
      LEFT JOIN departments d 
        ON p.dept_id = d.dept_id
    `
    const params = []

    // Add search filter if provided
    if (search) {
      query += ` WHERE p.position_title 
        LIKE ?`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY p.position_title ASC` 

    const [rows] = await db.query(
      query, params)

    res.json({
      success: true,
      data: rows,
      total: rows.length
    })
  } catch (err) {
    console.error(
      'getAllPositions error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions',
      error: err.message
    })
  }
}

// GET POSITION BY ID
const getPositionById = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await db.query(
      `SELECT p.*, d.dept_name
       FROM positions p
       LEFT JOIN departments d
         ON p.dept_id = d.dept_id
       WHERE p.position_id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      })
    }

    res.json({
      success: true,
      data: rows[0]
    })
  } catch (err) {
    console.error(
      'getPositionById error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch position',
      error: err.message
    })
  }
}

// CREATE POSITION
const createPosition = async (req, res) => {
  try {
    const { 
      position_title,
      min_salary,
      max_salary,
      dept_id
    } = req.body

    // Validate required field
    if (!position_title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Position title is required'
      })
    }

    // Check for duplicate
    const [existing] = await db.query(
      `SELECT position_id FROM positions 
       WHERE LOWER(position_title) = 
       LOWER(?)`,
      [position_title.trim()]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Position title already exists'
      })
    }

    // Insert with correct column names
    const [result] = await db.query(
      `INSERT INTO positions 
        (position_title, min_salary, 
         max_salary, dept_id)
       VALUES (?, ?, ?, ?)`,
      [
        position_title.trim(),
        min_salary || 0.00,
        max_salary || 0.00,
        dept_id || null
      ]
    )

    // Fetch created position with dept_name for immediate display
    const [newPosition] = await db.query(
      `SELECT p.*, d.dept_name
       FROM positions p
       LEFT JOIN departments d
         ON p.dept_id = d.dept_id
       WHERE p.position_id = ?`,
      [result.insertId]
    )

    return res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: newPosition[0]
    })

  } catch (err) {
    console.error(
      'createPosition error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to create position',
      error: err.message
    })
  }
}

// UPDATE POSITION
const updatePosition = async (req, res) => {
  try {
    const { id } = req.params
    const {
      position_title,
      min_salary,
      max_salary,
      dept_id
    } = req.body

    if (!position_title?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Position title is required'
      })
    }

    // Check duplicate (exclude current)
    const [existing] = await db.query(
      `SELECT position_id FROM positions
       WHERE LOWER(position_title) = 
         LOWER(?)
       AND position_id != ?`,
      [position_title.trim(), id]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Position title already exists'
      })
    }

    await db.query(
      `UPDATE positions SET
        position_title = ?,
        min_salary = ?,
        max_salary = ?,
        dept_id = ?
       WHERE position_id = ?`,
      [
        position_title.trim(),
        min_salary || 0.00,
        max_salary || 0.00,
        dept_id || null,
        id
      ]
    )

    return res.status(200).json({
      success: true,
      message: 'Position updated successfully'
    })

  } catch (err) {
    console.error(
      'updatePosition error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to update position',
      error: err.message
    })
  }
}

// DELETE POSITION
const deletePosition = async (req, res) => {
  try {
    const { id } = req.params

    // Check if position is in use
    const [inUse] = await db.query(
      `SELECT emp_id FROM employees
       WHERE position_id = ?
       LIMIT 1`,
      [id]
    )

    if (inUse.length > 0) {
      return res.status(400).json({
        success: false,
        message: 
          'Cannot delete position that ' +
          'is assigned to employees'
      })
    }

    await db.query(
      `DELETE FROM positions 
       WHERE position_id = ?`,
      [id]
    )

    return res.status(200).json({
      success: true,
      message: 'Position deleted successfully'
    })

  } catch (err) {
    console.error(
      'deletePosition error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete position',
      error: err.message
    })
  }
}

module.exports = {
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
}
