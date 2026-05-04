require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');


const Employee = require('./models/employeeModel')
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://mwf:shiraz2025@mwf-cluster.kqnzuip.mongodb.net/mwf?appName=mwf-cluster');
mongoose.connection.on('open', () => console.log('MongoDB connected'))
                  .on('error', err => console.log(err));

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
  mongoUrl: 'mongodb+srv://mwf:shiraz2025@mwf-cluster.kqnzuip.mongodb.net/mwf?appName=mwf-cluster'
}),
  cookie: { maxAge: 24*60*60*1000 }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(Employee.createStrategy()); 
passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

// Routes
app.use('/', authRoutes);



















// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
