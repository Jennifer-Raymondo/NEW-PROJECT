const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const User = require('./models/userModel');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL);
mongoose.connection.on('open', () => console.log('MongoDB connected'))
                  .on('error', err => console.log(err));

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
  cookie: { maxAge: 24*60*60*1000 }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.use('/', authRoutes);

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
