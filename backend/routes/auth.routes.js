const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const { validateSignup, validateLogin, validatePasswordUpdate } = require('../middleware/validators');

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.put('/update-password', authenticateToken, validatePasswordUpdate, authController.updatePassword);

module.exports = router;
