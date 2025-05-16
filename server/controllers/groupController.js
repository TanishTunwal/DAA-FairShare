const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const GroupInvitation = require('../models/GroupInvitation');

// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Get current user
        const user = await User.findById(req.user.id);

        // Create new group
        const newGroup = new Group({
            name,
            description,
            members: [{
                user: req.user.id,
                name: user.name,
                email: user.email
            }],
            createdBy: req.user.id
        });

        // Save group
        const group = await newGroup.save();

        // Add group to user's groups
        user.groups.push(group._id);
        await user.save();

        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get all groups for a user
exports.getUserGroups = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const groups = await Group.find(
            {
                _id: {
                    $in: user.groups
                }
            }
        );

        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get a single group by ID
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('expenses');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(member =>
            member.user.toString() === req.user.id
        );

        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to access this group' });
        }

        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Add a member to a group
exports.addMember = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find group
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the group creator
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only group creators can add members' });
        }

        // Check if user is already a member
        const isMember = group.members.some(member =>
            member.user.toString() === user._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ message: 'User is already a member of this group' });
        }

        // Check if invitation already exists
        const existingInvitation = await GroupInvitation.findOne({
            group: group._id,
            invitedUser: user._id,
            status: 'pending'
        });

        if (existingInvitation) {
            return res.status(400).json({ message: 'User has already been invited to this group' });
        }

        // Get inviter info
        const inviter = await User.findById(req.user.id);        // Create invitation
        const invitation = new GroupInvitation({
            group: group._id,
            groupName: group.name,
            invitedBy: req.user.id,
            inviterName: inviter.name,
            invitedUser: user._id,
            invitedEmail: user.email
        });

        await invitation.save();

        // Send a notification via socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${user._id}`).emit('group_invitation', {
                invitation,
                message: `You have been invited to join ${group.name} by ${inviter.name}`
            });
        }

        res.json({
            message: 'Invitation sent successfully',
            invitation
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Remove a member from a group
exports.removeMember = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find group
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the group creator
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to remove members' });
        }

        // Remove user from group
        group.members = group.members.filter(member =>
            member.user.toString() !== userId
        );

        await group.save();

        // Remove group from user's groups
        const user = await User.findById(userId);
        if (user) {
            user.groups = user.groups.filter(groupId =>
                groupId.toString() !== group._id.toString()
            );
            await user.save();
        }

        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the creator of the group
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this group' });
        }

        // Remove group reference from all members
        for (const member of group.members) {
            const user = await User.findById(member.user);
            if (user) {
                user.groups = user.groups.filter(groupId => groupId.toString() !== req.params.id);
                await user.save();
            }
        }

        // Delete all expenses associated with the group
        await Expense.deleteMany({ group: req.params.id });

        // Delete the group
        await Group.findByIdAndDelete(req.params.id); res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
    try {
        // Find group
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the creator
        if (group.createdBy.toString() === req.user.id) {
            return res.status(400).json({ message: 'Group creator cannot leave the group. You can delete the group instead.' });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(member => member.user.toString() === req.user.id);

        if (!isMember) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        // Remove user from group members
        group.members = group.members.filter(member => member.user.toString() !== req.user.id);
        await group.save();

        // Remove group from user's groups
        const user = await User.findById(req.user.id);
        if (user) {
            user.groups = user.groups.filter(groupId => groupId.toString() !== req.params.id);
            await user.save();
        }

        // Send notification via socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(req.params.id).emit('member_left', {
                groupId: req.params.id,
                userId: req.user.id,
                userName: user.name
            });
        }

        res.json({ message: 'You have left the group successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get all invitations for a user
exports.getUserInvitations = async (req, res) => {
    try {
        const invitations = await GroupInvitation.find({
            invitedUser: req.user.id,
            status: 'pending'
        }).sort({ createdAt: -1 });

        res.json(invitations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Respond to a group invitation
exports.respondToInvitation = async (req, res) => {
    try {
        const { invitationId, accept } = req.body;

        // Find invitation
        const invitation = await GroupInvitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        // Check if user is the invited user
        if (invitation.invitedUser.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to respond to this invitation' });
        }

        // Find group
        const group = await Group.findById(invitation.group);
        if (!group) {
            // If group doesn't exist anymore, delete the invitation
            await GroupInvitation.findByIdAndDelete(invitationId);
            return res.status(404).json({ message: 'Group no longer exists' });
        }

        if (accept) {
            // Add user to group
            group.members.push({
                user: req.user.id,
                name: invitation.invitedEmail.split('@')[0], // Fallback name
                email: invitation.invitedEmail
            });

            await group.save();

            // Add group to user's groups
            const user = await User.findById(req.user.id);
            user.groups.push(group._id);
            await user.save();            // Update invitation status
            invitation.status = 'accepted';
            await invitation.save();

            // Send notification to group owner via socket.io
            const io = req.app.get('io');
            if (io) {
                // Get user info for notification
                const user = await User.findById(req.user.id);

                io.to(`user_${invitation.invitedBy}`).emit('invitation_responded', {
                    type: 'accepted',
                    groupId: group._id,
                    groupName: group.name,
                    user: {
                        id: req.user.id,
                        name: user.name || invitation.invitedEmail.split('@')[0],
                        email: invitation.invitedEmail
                    }
                });
            }

            res.json({
                message: 'Invitation accepted',
                group
            });
        } else {            // Update invitation status
            invitation.status = 'declined';
            await invitation.save();

            // Send notification to group owner via socket.io
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${invitation.invitedBy}`).emit('invitation_responded', {
                    type: 'declined',
                    groupId: group._id,
                    groupName: group.name,
                    email: invitation.invitedEmail
                });
            }

            res.json({ message: 'Invitation declined' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Allow a member to leave a group
exports.leaveGroup = async (req, res) => {
    try {
        // Find group
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(member =>
            member.user.toString() === req.user.id
        );

        if (!isMember) {
            return res.status(403).json({ message: 'You are not a member of this group' });
        }

        // Check if user is the creator (creators can't leave their own groups)
        if (group.createdBy.toString() === req.user.id) {
            return res.status(403).json({ message: 'Group creator cannot leave the group. Delete the group instead.' });
        }

        // Remove user from group
        group.members = group.members.filter(member =>
            member.user.toString() !== req.user.id
        );

        await group.save();

        // Remove group from user's groups
        const user = await User.findById(req.user.id);
        if (user) {
            user.groups = user.groups.filter(groupId =>
                groupId.toString() !== group._id.toString()
            );
            await user.save();
        }

        res.json({ message: 'Successfully left the group' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};