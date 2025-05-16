const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', auth, groupController.createGroup);

// @route   GET /api/groups
// @desc    Get all groups for a user
// @access  Private
router.get('/', auth, groupController.getUserGroups);

// @route   GET /api/groups/invitations
// @desc    Get all pending invitations for a user
// @access  Private
router.get('/invitations', auth, groupController.getUserInvitations);

// @route   POST /api/groups/invitations/respond
// @desc    Respond to a group invitation
// @access  Private
router.post('/invitations/respond', auth, groupController.respondToInvitation);

// @route   GET /api/groups/:id
// @desc    Get a single group by ID
// @access  Private
router.get('/:id', auth, groupController.getGroupById);

// @route   POST /api/groups/:id/members
// @desc    Add a member to a group
// @access  Private
router.post('/:id/members', auth, groupController.addMember);

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove a member from a group
// @access  Private
router.delete('/:id/members/:userId', auth, groupController.removeMember);

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', auth, groupController.deleteGroup);

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', auth, groupController.leaveGroup);

module.exports = router;