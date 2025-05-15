const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const passport = require('passport');

// @route   POST /api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', userController.registerUser);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', userController.loginUser);

// @route   GET /api/users/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/users/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.CLIENT_URL}/login`
    }),
    (req, res) => {
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
);

// @route   GET /api/users/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.json({ success: true });
    });
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getUserProfile);

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, userController.getAllUsers);

module.exports = router; 