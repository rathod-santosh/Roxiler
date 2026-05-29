const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protect all routes to Store Owner role only
router.use(authenticateToken, requireRole(['store_owner']));

router.get('/dashboard', storeController.getStoreDashboard);

module.exports = router;
