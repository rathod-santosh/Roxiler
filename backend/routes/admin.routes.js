const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateAddUserAdmin } = require('../middleware/validators');

// Protect all routes in this router to Admin role only
router.use(authenticateToken, requireRole(['admin']));

router.get('/stats', adminController.getStats);
router.post('/users', validateAddUserAdmin, adminController.addUser);
router.get('/stores', adminController.getStores);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);

module.exports = router;
