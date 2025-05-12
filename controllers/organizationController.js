const Organization = require('../models/Organization');

// POST /organizations
exports.createOrganization = async (req, res) => {
    try {
        const { name, location } = req.body;
        // Basic validation
        if (!name || !location || !location.type || !location.coordinates || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return res.status(400).json({ message: 'Invalid input data. Name and GeoJSON Point location (longitude, latitude) required.' });
        }
        const newOrganization = new Organization({ name, location });
        await newOrganization.save();
        res.status(201).json(newOrganization);
    } catch (error) {
        if (error.code === 11000) { // Handle duplicate name error
            return res.status(409).json({ message: 'Organization name already exists.' });
        }
        res.status(500).json({ message: 'Error creating organization', error: error.message });
    }
};

// GET /organizations
exports.getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find();
        res.status(200).json(organizations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching organizations', error: error.message });
    }
};

// GET /organizations/:id
exports.getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.status(200).json(organization);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching organization', error: error.message });
    }
};

// PUT /organizations/:id
exports.updateOrganization = async (req, res) => {
    try {
        const { name, location } = req.body;
        const updatedOrganization = await Organization.findByIdAndUpdate(
            req.params.id,
            { name, location },
            { new: true, runValidators: true } // Return the updated doc and run schema validators
        );
        if (!updatedOrganization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.status(200).json(updatedOrganization);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Organization name already exists.' });
        }
        res.status(500).json({ message: 'Error updating organization', error: error.message });
    }
};

// DELETE /organizations/:id
exports.deleteOrganization = async (req, res) => {
     // Add logic here to check if employees are assigned before deleting?
    try {
        const deletedOrganization = await Organization.findByIdAndDelete(req.params.id);
        if (!deletedOrganization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.status(200).json({ message: 'Organization deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting organization', error: error.message });
    }
};