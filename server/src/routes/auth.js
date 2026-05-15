const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, logout, getMe } = require('../controllers/authController');
const { getPublicKey } = require('../utils/keyManager');

// Expose public key so the browser can encrypt passwords before sending
router.get('/public-key', (req, res) => {
  res.json({ publicKey: getPublicKey() });
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ max: 100 }).withMessage('Name too long'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    // Password arrives encrypted — validated after decryption in the controller
    body('encryptedPassword').notEmpty().withMessage('Password is required'),
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('encryptedPassword').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/logout', logout);
router.get('/me', auth, getMe);

module.exports = router;
