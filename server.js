// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');

const organizationRoutes = require('./routes/organizations');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json()); // Parse JSON request bodies

// Database Connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Mongoose 6 doesn't require useCreateIndex or useFindAndModify
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
    res.send('LocationCheckin API is running!');
});

app.use('/organizations', organizationRoutes);
app.use('/employees', employeeRoutes);
app.use('/attendance', attendanceRoutes);

// Basic Error Handling (can be expanded)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});