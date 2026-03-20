const db = require('../config/database');

/**
 * Get Manager's Team Members
 * GET /api/v1/manager/team
 */
const getTeamMembers = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;

    const [teamMembers] = await db.query(`
      SELECT 
        e.emp_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.hire_date,
        e.status,
        d.name as department_name,
        p.title as position_title,
        u.email as user_email,
        u.role as user_role
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.dept_id
      LEFT JOIN positions p ON e.position_id = p.position_id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.manager_id = ? AND e.status = 'active'
      ORDER BY e.first_name, e.last_name
    `, [managerEmpId]);

    res.status(200).json({
      success: true,
      message: 'Team members retrieved successfully',
      data: teamMembers,
      count: teamMembers.length
    });

  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching team members'
    });
  }
};

/**
 * Get Team Attendance
 * GET /api/v1/manager/team-attendance
 */
const getTeamAttendance = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    let params = [managerEmpId];

    if (start_date && end_date) {
      dateFilter = 'AND a.attendance_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      dateFilter = 'AND a.attendance_date >= ?';
      params.push(start_date);
    } else if (end_date) {
      dateFilter = 'AND a.attendance_date <= ?';
      params.push(end_date);
    }

    const [teamAttendance] = await db.query(`
      SELECT 
        e.emp_id,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        a.attendance_date,
        a.check_in,
        a.check_out,
        a.attendance_status,
        TIMESTAMPDIFF(HOUR, a.check_in, a.check_out) as hours_worked
      FROM employees e
      LEFT JOIN attendance a ON e.emp_id = a.emp_id
      WHERE e.manager_id = ? ${dateFilter}
      ORDER BY a.attendance_date DESC, e.first_name, e.last_name
    `, params);

    res.status(200).json({
      success: true,
      message: 'Team attendance retrieved successfully',
      data: teamAttendance,
      count: teamAttendance.length
    });

  } catch (error) {
    console.error('Get team attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching team attendance'
    });
  }
};

/**
 * Get Team Leave Requests
 * GET /api/v1/manager/team-leaves
 */
const getTeamLeaveRequests = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;
    const { status } = req.query;

    let statusFilter = '';
    let params = [managerEmpId];

    if (status) {
      statusFilter = 'AND lr.approval_status = ?';
      params.push(status);
    }

    const [teamLeaveRequests] = await db.query(`
      SELECT 
        lr.leave_id,
        lr.emp_id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.reason,
        lr.approval_status,
        lr.approved_by,
        lr.requested_at,
        e.employee_code,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.email as employee_email,
        approver.first_name as approved_by_name
      FROM leave_requests lr
      JOIN employees e ON lr.emp_id = e.emp_id
      LEFT JOIN employees approver ON lr.approved_by = approver.emp_id
      WHERE e.manager_id = ? ${statusFilter}
      ORDER BY lr.requested_at DESC
    `, params);

    res.status(200).json({
      success: true,
      message: 'Team leave requests retrieved successfully',
      data: teamLeaveRequests,
      count: teamLeaveRequests.length
    });

  } catch (error) {
    console.error('Get team leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching team leave requests'
    });
  }
};

/**
 * Approve/Reject Leave Request
 * PUT /api/v1/manager/leave-requests/:id/approve
 */
const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    const managerEmpId = req.managerEmpId;
    const userId = req.user.userId;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be either "approve" or "reject"'
      });
    }

    // Check if leave request belongs to manager's team
    const [leaveRequests] = await db.query(`
      SELECT lr.*, e.manager_id
      FROM leave_requests lr
      JOIN employees e ON lr.emp_id = e.emp_id
      WHERE lr.leave_id = ? AND e.manager_id = ?
    `, [id, managerEmpId]);

    if (leaveRequests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found or not accessible'
      });
    }

    const leaveRequest = leaveRequests[0];

    // Check if already processed
    if (leaveRequest.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request already ${leaveRequest.approval_status}`
      });
    }

    // Update leave request
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    await db.query(`
      UPDATE leave_requests 
      SET approval_status = ?, approved_by = ?, 
          comments = ?, updated_at = NOW()
      WHERE leave_id = ?
    `, [newStatus, managerEmpId, comments || null, id]);

    // Log the action
    await db.query(`
      INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      `LEAVE_REQUEST_${action.toUpperCase()}`,
      'leave_request',
      id,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      JSON.stringify({
        leave_id: id,
        action: action,
        employee_id: leaveRequest.emp_id,
        manager_id: managerEmpId,
        comments: comments
      })
    ]);

    res.status(200).json({
      success: true,
      message: `Leave request ${action}d successfully`,
      data: {
        leave_id: parseInt(id),
        status: newStatus,
        approved_by: managerEmpId
      }
    });

  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing leave request'
    });
  }
};

/**
 * Get Team Projects
 * GET /api/v1/manager/team-projects
 */
const getTeamProjects = async (req, res) => {
  try {
    const managerEmpId = req.managerEmpId;

    const [teamProjects] = await db.query(`
      SELECT DISTINCT
        p.project_id,
        p.project_name,
        p.description,
        p.start_date,
        p.end_date,
        p.status,
        COUNT(ep.emp_id) as team_members_count
      FROM projects p
      JOIN employee_projects ep ON p.project_id = ep.project_id
      JOIN employees e ON ep.emp_id = e.emp_id
      WHERE e.manager_id = ?
      GROUP BY p.project_id
      ORDER BY p.project_name
    `, [managerEmpId]);

    res.status(200).json({
      success: true,
      message: 'Team projects retrieved successfully',
      data: teamProjects,
      count: teamProjects.length
    });

  } catch (error) {
    console.error('Get team projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching team projects'
    });
  }
};

/**
 * Assign Employee to Project
 * POST /api/v1/manager/project-assignment
 */
const assignToProject = async (req, res) => {
  try {
    const { emp_id, project_id, role_name, allocation_percent } = req.body;
    const managerEmpId = req.managerEmpId;
    const userId = req.user.userId;

    // Validate required fields
    if (!emp_id || !project_id || !role_name || !allocation_percent) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: emp_id, project_id, role_name, allocation_percent'
      });
    }

    // Validate allocation percentage
    if (allocation_percent < 1 || allocation_percent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Allocation percentage must be between 1 and 100'
      });
    }

    // Check if employee belongs to manager's team
    const [employees] = await db.query(
      'SELECT emp_id FROM employees WHERE emp_id = ? AND manager_id = ?',
      [emp_id, managerEmpId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not in your team'
      });
    }

    // Check if project exists
    const [projects] = await db.query(
      'SELECT project_id FROM projects WHERE project_id = ?',
      [project_id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if already assigned
    const [existingAssignments] = await db.query(
      'SELECT assignment_id FROM employee_projects WHERE emp_id = ? AND project_id = ? AND released_on IS NULL',
      [emp_id, project_id]
    );

    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already assigned to this project'
      });
    }

    // Create assignment
    const [result] = await db.query(`
      INSERT INTO employee_projects (emp_id, project_id, role_name, allocation_percent, assigned_on)
      VALUES (?, ?, ?, ?, NOW())
    `, [emp_id, project_id, role_name, allocation_percent]);

    // Log the action
    await db.query(`
      INSERT INTO audit_log (user_id, action, resource, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      'PROJECT_ASSIGNMENT',
      'employee_project',
      result.insertId,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown',
      JSON.stringify({
        emp_id,
        project_id,
        role_name,
        allocation_percent,
        manager_id: managerEmpId
      })
    ]);

    res.status(201).json({
      success: true,
      message: 'Employee assigned to project successfully',
      data: {
        assignment_id: result.insertId,
        emp_id,
        project_id,
        role_name,
        allocation_percent,
        assigned_on: new Date()
      }
    });

  } catch (error) {
    console.error('Assign to project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while assigning to project'
    });
  }
};

module.exports = {
  getTeamMembers,
  getTeamAttendance,
  getTeamLeaveRequests,
  approveLeaveRequest,
  getTeamProjects,
  assignToProject
};
