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

// ✅ ADD THIS - trust Railway's proxy
app.set('trust proxy', 1);

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

// ✅ UPDATED SESSION CONFIG
app.use(session({
  secret: 'mwfsecretkey123',
  resave: true,           // ✅ changed to true
  saveUninitialized: true, // ✅ changed to true
  store: MongoStore.create({ 
    mongoUrl: 'mongodb+srv://mwf:shiraz2025@mwf-cluster.kqnzuip.mongodb.net/mwf?appName=mwf-cluster'
  }),
  cookie: { 
    maxAge: 24*60*60*1000,
    secure: true,   // ✅ required for Railway HTTPS
    httpOnly: true,
    sameSite: 'none' // ✅ required for cross-site cookies
  }
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(Employee.createStrategy()); 
passport.serializeUser(Employee.serializeUser());
passport.deserializeUser(Employee.deserializeUser());

// Routes
app.use('/', authRoutes);

app.listen(port, () => console.log(`Server running on port ${port}`));