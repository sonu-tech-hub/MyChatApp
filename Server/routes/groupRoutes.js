const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Protected routes
router.post('/', authMiddleware, groupController.createGroup);
router.get('/', authMiddleware, groupController.getUserGroups);
router.get('/:groupId', authMiddleware, groupController.getGroupById);
router.put('/:groupId', authMiddleware, groupController.updateGroup);
router.delete('/:groupId', authMiddleware, groupController.deleteGroup);
router.get('/:groupId/messages', authMiddleware, groupController.getGroupMessages);
router.post('/:groupId/members', authMiddleware, groupController.addGroupMembers);
router.delete('/:groupId/members/:userId', authMiddleware, groupController.removeGroupMember);
router.put('/:groupId/members/:userId', authMiddleware, groupController.updateMemberRole);
router.post('/:groupId/call', authMiddleware, groupController.startGroupCall);

module.exports = router;