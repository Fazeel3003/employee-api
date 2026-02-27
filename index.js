require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const employeeRoutes = require("./routes/employeeRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const positionRoutes = require("./routes/positionRoutes");

require("./db");

app.use(cors());
app.use(express.json());

// ✅ Versioned API route
app.use("/api/v1/employees", employeeRoutes);

app.use("/api/v1/departments", departmentRoutes);

app.use("/api/v1/positions", positionRoutes);


const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` MVC Server Running on Port ${PORT} `);
});
