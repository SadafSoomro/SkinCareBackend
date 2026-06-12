import Message from '../Models/MessageSchema.js';
import User from '../Models/UserSchema.js';

// @desc    Get chat history between current user and admin
// @route   GET /chat/history/:userId
// @access  Private
export const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Either the requester is the user, or the requester is an admin
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: 'admin' },
                { senderId: 'admin', receiverId: userId } // Actually, admin senderId might be the admin's ObjectId, but we can treat 'admin' as a generic receiver/sender for simplicity.
            ]
        }).sort({ createdAt: 1 });

        // For flexibility, if admin sends a message, they might send with senderId = adminId and receiverId = userId
        // Let's modify the query to handle both cases where admin is identified by 'admin' or their role.
        // Easiest is: if senderId is the user, or receiverId is the user.
        const allMessages = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        res.json(allMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get list of users who have messaged the admin
// @route   GET /chat/contacts
// @access  Private/Admin
export const getChatContacts = async (req, res) => {
    try {
        // Find all distinct senderIds where receiver is admin
        const messages = await Message.find({});
        const userIds = new Set();
        
        messages.forEach(msg => {
            if (msg.senderId && msg.senderId.toString() !== req.user._id.toString()) {
                userIds.add(msg.senderId.toString());
            }
            if (msg.receiverId && msg.receiverId !== 'admin' && msg.receiverId.toString() !== req.user._id.toString()) {
                userIds.add(msg.receiverId.toString());
            }
        });

        const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name email');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
