import Message from '../Models/MessageSchema.js';
import User from '../Models/UserSchema.js';
import mongoose from 'mongoose';

// @desc    Get chat history between a user and admin
// @route   GET /chat/history/:userId
// @access  Private
export const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // Either the requester is the user themselves, or the requester is an admin
        const requesterId = req.user._id.toString();
        if (requesterId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Find all messages between this user and admin (in both directions)
        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        // Deduplicate by _id
        const seen = new Set();
        const unique = messages.filter(m => {
            const id = m._id.toString();
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        res.json(unique);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get list of users who have messaged the admin
// @route   GET /chat/contacts
// @access  Private/Admin
export const getChatContacts = async (req, res) => {
    try {
        const adminId = req.user._id.toString();

        const messages = await Message.find({}).sort({ createdAt: 1 });
        const userStats = {};

        messages.forEach(msg => {
            const senderId = msg.senderId?.toString();
            const receiverId = msg.receiverId?.toString();
            let contactId = null;

            if (senderId && senderId !== adminId && receiverId === 'admin') {
                contactId = senderId;
            } else if (receiverId && receiverId !== 'admin' && receiverId !== adminId && senderId === adminId) {
                contactId = receiverId;
            } else if (senderId && senderId !== adminId) {
                contactId = senderId;
            }

            if (contactId) {
                if (!userStats[contactId]) {
                    userStats[contactId] = { unread: 0, lastMessage: null };
                }
                userStats[contactId].lastMessage = msg;
                if (msg.receiverId === 'admin' && !msg.isRead) {
                    userStats[contactId].unread += 1;
                }
            }
        });

        const validIds = Object.keys(userStats).filter(id => mongoose.Types.ObjectId.isValid(id));
        const users = await User.find({ _id: { $in: validIds } }).select('name email role');

        const nonAdminUsers = users.filter(u => u.role !== 'admin').map(u => ({
            ...u.toObject(),
            unreadCount: userStats[u._id.toString()].unread,
            lastMessage: userStats[u._id.toString()].lastMessage
        }));

        // Sort contacts by last message time (newest first)
        nonAdminUsers.sort((a, b) => {
            const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
        });

        res.json(nonAdminUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
