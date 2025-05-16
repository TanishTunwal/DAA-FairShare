const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('passport');

// Import routes
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');

// Load environment variables
dotenv.config();

// Configure passport
require('./config/passport');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/expense-sharing-daa')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Make io available to route handlers
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Store user ID for this socket
    socket.on('register_user', (userId) => {
        socket.userId = userId;
        socket.join(`user_${userId}`); // Join a personal room
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Join a group room
    socket.on('join_group', (groupId) => {
        socket.join(groupId);
        console.log(`User ${socket.id} joined group: ${groupId}`);
    });

    // Leave a group room
    socket.on('leave_group', (groupId) => {
        socket.leave(groupId);
        console.log(`User ${socket.id} left group: ${groupId}`);
    });

    // New expense added
    socket.on('expense_added', (data) => {
        socket.to(data.groupId).emit('expense_added', data);
    });

    // Settlement update
    socket.on('settlement_update', (data) => {
        socket.to(data.groupId).emit('settlement_update', data);
    });

    // Expense deleted
    socket.on('expense_deleted', (data) => {
        socket.to(data.groupId).emit('expense_deleted', data);
    });    // Member removed
    socket.on('member_removed', (data) => {
        socket.to(data.groupId).emit('member_removed', data);
    });

    // Member left
    socket.on('member_left', (data) => {
        socket.to(data.groupId).emit('member_left', data);
    });

    // Group deleted
    socket.on('group_deleted', (data) => {
        socket.broadcast.emit('group_deleted', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Expense Sharing DAA API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 