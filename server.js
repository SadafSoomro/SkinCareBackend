import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import Message from './Models/MessageSchema.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // adjust in production
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_chat', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their chat room`);
    });

    socket.on('join_admin', () => {
        socket.join('admin_room');
        console.log(`Admin joined admin_room`);
    });

    socket.on('send_message', async (data) => {
        // data: { senderId, receiverId, message }
        try {
            const newMessage = await Message.create({
                senderId: data.senderId,
                receiverId: data.receiverId,
                message: data.message
            });

            // If user sends to admin
            if (data.receiverId === 'admin') {
                io.to('admin_room').emit('receive_message', newMessage);
                io.to(data.senderId).emit('receive_message', newMessage); // echo back
            } 
            // If admin sends to user
            else {
                io.to(data.receiverId).emit('receive_message', newMessage);
                io.to('admin_room').emit('receive_message', newMessage); // echo back
            }
        } catch (error) {
            console.error('Socket message error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

if (!process.env.VERCEL) {
    const { connectDB } = await import('./Utils/db.js');
    connectDB()
        .then(() => console.log('Connected to MongoDB'))
        .catch((error) => console.error('Error connecting to MongoDB:', error.message));

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default server;
