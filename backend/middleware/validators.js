const { body, validationResult } = require('express-validator');

// Helper middleware to verify results and return formatted errors
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Password complexity regex: 8-16 chars, 1 uppercase, 1 special char
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,16}$/;

const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Name must be between 20 and 60 characters long.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required.')
    .isLength({ max: 400 })
    .withMessage('Address cannot exceed 400 characters.'),
  body('password')
    .matches(passwordRegex)
    .withMessage('Password must be 8-16 characters and contain at least one uppercase letter and one special character.'),
  body('role')
    .optional()
    .isIn(['user', 'store_owner', 'admin'])
    .withMessage('Invalid signup role specified.'),
  validateResults
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
  validateResults
];

const validatePasswordUpdate = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required.'),
  body('newPassword')
    .matches(passwordRegex)
    .withMessage('New password must be 8-16 characters and contain at least one uppercase letter and one special character.'),
  validateResults
];

const validateAddUserAdmin = [
  body('name')
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Name must be between 20 and 60 characters long.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required.')
    .isLength({ max: 400 })
    .withMessage('Address cannot exceed 400 characters.'),
  body('password')
    .matches(passwordRegex)
    .withMessage('Password must be 8-16 characters and contain at least one uppercase letter and one special character.'),
  body('role')
    .isIn(['admin', 'user', 'store_owner'])
    .withMessage('Invalid user role specified.'),
  validateResults
];

const validateAddStoreAdmin = [
  body('name')
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Store name must be between 20 and 60 characters long.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid store email address.')
    .normalizeEmail(),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Store address is required.')
    .isLength({ max: 400 })
    .withMessage('Store address cannot exceed 400 characters.'),
  body('password')
    .matches(passwordRegex)
    .withMessage('Store owner password must be 8-16 characters and contain at least one uppercase letter and one special character.'),
  validateResults
];

const validateSubmitRating = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5.'),
  validateResults
];

module.exports = {
  validateSignup,
  validateLogin,
  validatePasswordUpdate,
  validateAddUserAdmin,
  validateAddStoreAdmin,
  validateSubmitRating
};
