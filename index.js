const express = require('express');
const app = express();

app.use(express.json());

let employees = [
    { id: 1, name: "John Doe", position: "Developer", salary: 50000 }
];

// ✅ Validation Middleware
function validateEmployee(req, res, next) {
    const { name, position, salary } = req.body;

    if (!name || !position || salary === undefined) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (typeof salary !== "number") {
        return res.status(400).json({ message: "Salary must be a number" });
    }

    next();
}

// ✅ GET ALL
app.get('/employees', (req, res) => {
    res.json(employees);
});

// ✅ GET BY ID
app.get('/employees/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const employee = employees.find(emp => emp.id === id);

    if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
});

// ✅ CREATE
app.post('/employees', validateEmployee, (req, res) => {
    const newEmployee = {
        id: employees.length ? employees[employees.length - 1].id + 1 : 1,
        ...req.body
    };

    employees.push(newEmployee);
    res.status(201).json(newEmployee);
});

// ✅ UPDATE
app.put('/employees/:id', validateEmployee, (req, res) => {
    const id = parseInt(req.params.id);
    const index = employees.findIndex(emp => emp.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Employee not found" });
    }

    employees[index] = { id, ...req.body };
    res.json(employees[index]);
});

// ✅ DELETE
app.delete('/employees/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = employees.findIndex(emp => emp.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Employee not found" });
    }

    employees.splice(index, 1);
    res.json({ message: "Employee deleted successfully" });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
