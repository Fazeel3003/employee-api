require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const employeeRoutes = require("./routes/employeeRoutes");
const employeeProjectRoutes = require("./routes/employeeProjectRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const positionRoutes = require("./routes/positionRoutes");
const projectRoutes = require("./routes/projectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const salaryRoutes = require("./routes/salaryRoutes");

require("./db");

app.use(cors());
app.use(express.json());

// ✅ Versioned API route
app.use("/api/v1/employees", employeeRoutes);

app.use("/api/v1/departments", departmentRoutes);

app.use("/api/v1/positions", positionRoutes);

app.use("/api/v1/projects", projectRoutes);

app.use("/api/v1/employee-projects", employeeProjectRoutes);

app.use("/api/v1/attendance", attendanceRoutes);

app.use("/api/v1/leaves", leaveRoutes);

app.use("/api/v1/salary-history", salaryRoutes);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` MVC Server Running on Port ${PORT} `);
});

