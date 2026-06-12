import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            // "admin" is a special string, or we can use the admin's ObjectId.
            // For simplicity, we can let receiverId be a string, either an ObjectId or "admin".
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
