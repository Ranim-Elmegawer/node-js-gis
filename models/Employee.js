const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: { // A unique identifier for the employee within the system
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Reference to the organization the employee belongs to
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization', // Refers to the 'Organization' model
        required: true
    }
    // Add other relevant fields like email, position, etc. if needed
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);