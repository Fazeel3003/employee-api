require("dotenv").config();
const express = require("express");
const app = express();
const employeeRoutes = require("./routes/employeeRoutes");
const PORT = process.env.PORT || 3000;
require("./db"); // just to initialize connection

app.use(express.json());

app.use("/employees", employeeRoutes);



app.listen(PORT, () => {
  console.log(`🔥 MVC Server Running on Port ${PORT} 🔥`);
});


const errorHandler = require("./middleware/errorHandler");

app.use(errorHandler);

