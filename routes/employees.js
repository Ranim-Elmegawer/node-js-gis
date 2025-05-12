const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Define routes for employee management
router.post('/', employeeController.createEmployee);         // Create a new employee
router.get('/', employeeController.getAllEmployees);         // List all employees
router.get('/:id', employeeController.getEmployeeById);      // Get details of a specific employee by MongoDB _id
router.put('/:id', employeeController.updateEmployee);       // Update employee info by MongoDB _id
router.delete('/:id', employeeController.deleteEmployee);    // Delete an employee by MongoDB _id

module.exports = router;