const express = require('express');
const app = express();

app.use(express.json());

let employees = [
    { id: 1, name: "John Doe", position: "Developer", salary: 50000 }
];

// GET all employees
app.get('/employees', (req, res) => {
    res.json(employees);
});

// CREATE employee
app.post('/employees', (req, res) => {
    const { name, position, salary } = req.body;

    const newEmployee = {
        id: employees.length + 1,
        name,
        position,
        salary
    };

    employees.push(newEmployee);
    res.status(201).json(newEmployee);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
