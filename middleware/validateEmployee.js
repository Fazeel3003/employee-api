function validateEmployee(req, res, next) {
  const {
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    hire_date,
    status,
    dept_id,
    position_id
  } = req.body;

  // Required fields check
  if (
    !employee_code ||
    !first_name ||
    !last_name ||
    !email ||
    !phone ||
    !hire_date ||
    !status ||
    !dept_id ||
    !position_id
  ) {
    return res.status(400).json({
      message: "All required fields must be provided"
    });
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format"
    });
  }

  // Numeric validation
  if (isNaN(dept_id) || isNaN(position_id)) {
    return res.status(400).json({
      message: "dept_id and position_id must be numbers"
    });
  }

  // Status validation
  const allowedStatus = ["Active", "Inactive"];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      message: "Status must be Active or Inactive"
    });
  }

  next();
}

module.exports = validateEmployee;
