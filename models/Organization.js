const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const organizationSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
        },
        coordinates: {
            type: [Number], // Array of numbers for longitude and latitude
            required: true
            // NOTE: MongoDB expects coordinates in [longitude, latitude] order
        }
    }
}, { timestamps: true });

// Apply the 2dsphere index for geospatial queries
organizationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Organization', organizationSchema);