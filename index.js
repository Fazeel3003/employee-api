require("dotenv").config();
const express = require("express");
const app = express();
const employeeRoutes = require("./routes/employeeRoutes");
require("./db");

app.use(express.json());

// ✅ Versioned API route
app.use("/api/v1/employees", employeeRoutes);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 MVC Server Running on Port ${PORT} 🔥`);
});
