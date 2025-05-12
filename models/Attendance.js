const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
    employee: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    checkInTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    checkOutTime: {
        type: Date
    },
    checkInLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: { // [longitude, latitude]
            type: [Number],
            required: true
        }
    },
    checkOutLocation: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: { // [longitude, latitude]
            type: [Number]
        }
    },
    durationMinutes: { // Calculated duration in minutes
        type: Number
    },
    status: { // To track if currently checked in or out
        type: String,
        enum: ['checked-in', 'checked-out'],
        default: 'checked-in'
    }
}, { timestamps: true });

// Indexing employee for faster lookups
attendanceSchema.index({ employee: 1 });
attendanceSchema.index({ employee: 1, checkInTime: -1 }); // Useful for finding latest check-in

module.exports = mongoose.model('Attendance', attendanceSchema);