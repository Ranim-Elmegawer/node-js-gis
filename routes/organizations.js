const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');

router.post('/', organizationController.createOrganization);
router.get('/', organizationController.getAllOrganizations);
router.get('/:id', organizationController.getOrganizationById);
router.put('/:id', organizationController.updateOrganization);
router.delete('/:id', organizationController.deleteOrganization);

module.exports = router;