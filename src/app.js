require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const logger = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');
const path = require('path');

// cors options
const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-attempt-token"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// import routes
const authRoutes = require('./routes/auth.route');
const teacherRoutes = require('./routes/teacher/teacher.route');
const studentRoutes = require('./routes/student/student.route');
const userRoutes = require('./routes/user.route');

// register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/user', userRoutes);

// error handler
app.use(errorHandler);

module.exports = app;