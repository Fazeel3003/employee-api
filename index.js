require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Import routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const employeeProjectRoutes = require("./routes/employeeProjectRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const positionRoutes = require("./routes/positionRoutes");
const projectRoutes = require("./routes/projectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const salaryRoutes = require("./routes/salaryRoutes");

require("./db");

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Authentication routes (public)
app.use("/api/v1/auth", authRoutes);

// ✅ Versioned API routes (protected)
app.use("/api/v1/employees", employeeRoutes);

app.use("/api/v1/departments", departmentRoutes);

app.use("/api/v1/positions", positionRoutes);

app.use("/api/v1/projects", projectRoutes);

app.use("/api/v1/employee-projects", employeeProjectRoutes);

app.use("/api/v1/attendance", attendanceRoutes);

// ✅ Fixed: Use leave-requests to match frontend
app.use("/api/v1/leave-requests", leaveRoutes);

app.use("/api/v1/salary-history", salaryRoutes);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` MVC Server Running on Port ${PORT} `);
});
