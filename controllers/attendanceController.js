const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');

const CHECKIN_RADIUS_METERS = 100; // Check-in allowed within 100 meters

// POST /attendance/checkin
exports.checkIn = async (req, res) => {
    try {
        const { employeeId, location } = req.body; // location: { type: 'Point', coordinates: [lng, lat] }

        if (!employeeId || !location || !location.type || !location.coordinates || location.type !== 'Point' || location.coordinates.length !== 2) {
            return res.status(400).json({ message: 'Employee ID and valid GeoJSON Point location required.' });
        }

        const employee = await Employee.findOne({ employeeId: employeeId }).populate('organization');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        if (!employee.organization || !employee.organization.location) {
             return res.status(400).json({ message: 'Employee organization or location not set.' });
        }

         // Check if already checked in today (or currently checked-in)
         const existingCheckin = await Attendance.findOne({
            employee: employee._id,
            status: 'checked-in'
        });
        if (existingCheckin) {
            return res.status(409).json({ message: 'Employee is already checked in.' });
        }


        // *** Geospatial Check ***
        // Find the organization using $nearSphere to check distance
        const orgLocation = employee.organization.location.coordinates; // [lng, lat]
        const checkInCoords = location.coordinates; // [lng, lat]

         // Using MongoDB's geospatial query capability directly
         const organizationInProximity = await Organization.findOne({
             _id: employee.organization._id, // Ensure it's the correct organization
             location: {
                 $nearSphere: {
                     $geometry: {
                         type: "Point",
                         coordinates: checkInCoords // Employee's current location
                     },
                     $maxDistance: CHECKIN_RADIUS_METERS // Max distance in meters
                 }
             }
         });

        if (!organizationInProximity) {
             return res.status(403).json({ message: `Check-in failed. You must be within ${CHECKIN_RADIUS_METERS} meters of your organization's location.` });
         }

        // If within range, record the check-in
        const newAttendance = new Attendance({
            employee: employee._id,
            checkInLocation: location,
            status: 'checked-in'
            // checkInTime defaults to Date.now
        });

        await newAttendance.save();
        res.status(201).json({ message: 'Check-in successful', attendance: newAttendance });

    } catch (error) {
        res.status(500).json({ message: 'Error during check-in', error: error.message });
    }
};

// POST /attendance/checkout
exports.checkOut = async (req, res) => {
    try {
        const { employeeId, location } = req.body;

        if (!employeeId || !location || !location.type || !location.coordinates || location.type !== 'Point' || location.coordinates.length !== 2) {
            return res.status(400).json({ message: 'Employee ID and valid GeoJSON Point location required.' });
        }

         const employee = await Employee.findOne({ employeeId: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found.' });
        }

        // Find the latest 'checked-in' record for this employee
        const attendanceRecord = await Attendance.findOneAndUpdate(
            { employee: employee._id, status: 'checked-in' },
            {
                $set: {
                    checkOutTime: new Date(),
                    checkOutLocation: location,
                    status: 'checked-out'
                }
            },
            { new: true, sort: { checkInTime: -1 } } // Get the latest record and return the updated one
        );

        if (!attendanceRecord) {
            return res.status(404).json({ message: 'No active check-in found for this employee.' });
        }

        // Calculate duration
        const durationMs = attendanceRecord.checkOutTime.getTime() - attendanceRecord.checkInTime.getTime();
        attendanceRecord.durationMinutes = Math.round(durationMs / (1000 * 60)); // Duration in minutes
        await attendanceRecord.save();


        res.status(200).json({ message: 'Check-out successful', attendance: attendanceRecord });

    } catch (error) {
        res.status(500).json({ message: 'Error during check-out', error: error.message });
    }
};

// GET /attendance/employee/:id (Employee's MongoDB _id)
exports.getEmployeeAttendance = async (req, res) => {
    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(400).json({ message: 'Invalid Employee ID format.' });
         }
        const records = await Attendance.find({ employee: req.params.id }).sort({ checkInTime: -1 }).populate('employee', 'name employeeId');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
    }
};

// GET /attendance/today/:id (Employee's MongoDB _id)
exports.getTodaysAttendance = async (req, res) => {
    try {
         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
             return res.status(400).json({ message: 'Invalid Employee ID format.' });
         }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const records = await Attendance.find({
            employee: req.params.id,
            checkInTime: {
                $gte: todayStart,
                $lt: todayEnd
            }
        }).sort({ checkInTime: -1 }).populate('employee', 'name employeeId');

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching today\'s attendance', error: error.message });
    }
};

// GET /attendance
exports.getAllAttendance = async (req, res) => {
    try {
        // Consider adding pagination for large datasets
        const records = await Attendance.find().sort({ checkInTime: -1 }).populate('employee', 'name employeeId');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all attendance records', error: error.message });
    }
};

 // GET /attendance/within-range?lat=..&lng=..&employeeId=.. (employeeId is the unique string ID)
exports.isWithinRange = async (req, res) => {
     try {
         const { lat, lng, employeeId } = req.query;

         if (!lat || !lng || !employeeId) {
             return res.status(400).json({ message: 'Latitude, longitude, and employeeId query parameters are required.' });
         }

         const latitude = parseFloat(lat);
         const longitude = parseFloat(lng);

         if (isNaN(latitude) || isNaN(longitude)) {
             return res.status(400).json({ message: 'Invalid latitude or longitude.' });
         }

         const employee = await Employee.findOne({ employeeId: employeeId }).populate('organization', 'location');
         if (!employee) {
             return res.status(404).json({ message: 'Employee not found.' });
         }
          if (!employee.organization || !employee.organization.location) {
             return res.status(400).json({ message: 'Employee organization or location not set.' });
        }

         const checkCoords = [longitude, latitude]; // Employee's current location

         const organizationInProximity = await Organization.findOne({
             _id: employee.organization._id,
             location: {
                 $nearSphere: {
                     $geometry: {
                         type: "Point",
                         coordinates: checkCoords
                     },
                     $maxDistance: CHECKIN_RADIUS_METERS
                 }
             }
         });

         res.status(200).json({ isWithinRange: !!organizationInProximity }); // Return true if found, false otherwise

     } catch (error) {
         res.status(500).json({ message: 'Error checking range', error: error.message });
     }
 };