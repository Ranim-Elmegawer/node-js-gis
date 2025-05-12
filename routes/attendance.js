const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);
router.get('/employee/:id', attendanceController.getEmployeeAttendance); // Use employee's _id
router.get('/today/:id', attendanceController.getTodaysAttendance); // Use employee's _id
router.get('/', attendanceController.getAllAttendance); // Admin view
router.get('/within-range', attendanceController.isWithinRange); // Optional range check

module.exports = router;