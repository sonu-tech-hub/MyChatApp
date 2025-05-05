const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Protected routes
router.post('/', authMiddleware, groupController.createGroup); // Create Group
router.get('/', authMiddleware, groupController.getUserGroups); // Get User Groups
router.get('/groups/:groupId', authMiddleware, groupController.getGroupById); // Get Group by ID
router.put('/groups/:groupId', authMiddleware, groupController.updateGroup); // Update Group
router.delete('/groups/:groupId', authMiddleware, groupController.deleteGroup); // Delete Group
router.get('/groups/:groupId/messages', authMiddleware, groupController.getGroupMessages); // Get Group Messages
router.post('/groups/:groupId/members', authMiddleware, groupController.addGroupMembers); // Add Members to Group
router.delete('/groups/:groupId/members/:userId', authMiddleware, groupController.removeGroupMember); // Remove Member from Group
router.put('/groups/:groupId/members/:userId', authMiddleware, groupController.updateMemberRole); // Update Member Role
router.post('/groups/:groupId/call', authMiddleware, groupController.startGroupCall); // Start Group Call


module.exports = router;
