const express = require("express");
const app = express();
const employeeRoutes = require("./routes/employeeRoutes");
require("./db"); // just to initialize connection

app.use(express.json());

app.use("/employees", employeeRoutes);

app.listen(3000, () => {
  console.log("🔥 MVC Server Running on Port 3000 🔥");
});

const errorHandler = require("./middleware/errorHandler");

app.use(errorHandler);

