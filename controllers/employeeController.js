const Employee = require('../models/Employee');
const Organization = require('../models/Organization'); // To validate organization existence
const mongoose = require('mongoose');

// POST /employees
exports.createEmployee = async (req, res) => {
    try {
        const { name, employeeId, organizationId } = req.body;
        if (!name || !employeeId || !organizationId) {
            return res.status(400).json({ message: 'Name, employeeId, and organizationId are required.' });
        }

        // Check if organizationId is a valid ObjectId format before querying
        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
             return res.status(400).json({ message: 'Invalid Organization ID format.' });
        }

        // Check if organization exists
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: 'Assigned organization not found.' });
        }

        const newEmployee = new Employee({ name, employeeId, organization: organizationId });
        await newEmployee.save();
        // Populate the organization name before sending the response
        const populatedEmployee = await Employee.findById(newEmployee._id).populate('organization', 'name');
        res.status(201).json(populatedEmployee);

    } catch (error) {
        if (error.code === 11000) { // Handle duplicate employeeId
            return res.status(409).json({ message: 'Employee ID already exists.' });
        }
        console.error("Error creating employee:", error); // Log the actual error
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};

// GET /employees
exports.getAllEmployees = async (req, res) => {
    try {
        // Populate organization details when fetching employees
        const employees = await Employee.find().populate('organization', 'name'); // Select only 'name' from organization
        res.status(200).json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
};

// GET /employees/:id
exports.getEmployeeById = async (req, res) => {
    try {
         // Check if id is a valid ObjectId format
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(400).json({ message: 'Invalid Employee ID format.' });
         }

        const employee = await Employee.findById(req.params.id).populate('organization', 'name location'); // Populate name and location
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ message: 'Error fetching employee', error: error.message });
    }
};

// PUT /employees/:id
exports.updateEmployee = async (req, res) => {
    try {
        // Check if id is a valid ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid Employee ID format.' });
        }

        const { name, employeeId, organizationId } = req.body;
        let updateData = {};
        if (name) updateData.name = name;
        if (employeeId) updateData.employeeId = employeeId;


        // If changing organization, validate the new one exists
        if (organizationId) {
             if (!mongoose.Types.ObjectId.isValid(organizationId)) {
                 return res.status(400).json({ message: 'Invalid New Organization ID format.' });
            }
            const organization = await Organization.findById(organizationId);
            if (!organization) {
                return res.status(404).json({ message: 'New assigned organization not found.' });
            }
             updateData.organization = organizationId;
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            updateData, // Use the selective update object
            { new: true, runValidators: true }
        ).populate('organization', 'name'); // Populate name in the response

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(updatedEmployee);
    } catch (error) {
        if (error.code === 11000) { // Handle duplicate employeeId on update
            return res.status(409).json({ message: 'Employee ID already exists.' });
        }
         console.error("Error updating employee:", error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};

// DELETE /employees/:id
exports.deleteEmployee = async (req, res) => {
    // Add logic here to handle related attendance records?
    try {
         // Check if id is a valid ObjectId format
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(400).json({ message: 'Invalid Employee ID format.' });
         }

        const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Consider deleting related attendance records here or setting employee to null in attendance
        // Example: await Attendance.deleteMany({ employee: req.params.id });
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
         console.error("Error deleting employee:", error);
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
};