const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateSubmitRating } = require('../middleware/validators');

// Protect all routes to Normal User role only
router.use(authenticateToken, requireRole(['user']));

router.get('/stores', ratingController.getStoresForUser);
router.post('/rate', validateSubmitRating, ratingController.submitRating);

module.exports = router;
