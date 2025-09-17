1//Dependencies
const express = require('express');//importing
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');

require('dotenv').config();
const signupModels = require('./models/signupModels');
//import routes
const authRoutes = require('./routes/authRoutes.js');



2//Instantiations 
const app = express();//intantiate app
const port = 3000;


3//Configurations

//setting up mongodb connections
mongoose.connect(process.env.MONGODB_URL, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});

mongoose.connection
  .on('open', () => {
    console.log('Mongoose connection open');
  })
  .on('error', (err) => {
    console.log(`Connection error: ${err.message}`);
  });

//setting view engine to pug
app.set('view engine', 'pug');  //  tell Express to use Pug
app.set('views', path.join(__dirname, 'views'));  //  where your pug files are




4//Middleware
//midleware
app.use(express.static('public'));//helps us to get or specify where our static files are
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true}));//it helps to pass  data from forms
//express session configs
app.use(expressSession({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({mongoUrl:process.env.MONGODB_URL}),
  cookie: {maxAge: 24*60*60*1000} 
}))




//passport configs
// app.use(passport.initialize());
// app.use(passport.session());

//Authenticate with passport stragty
// passport.use(UserModel.createStrategy());
// passport.serializeUser(UserModel.serializeUser());
// passport.deserializeUser(UserModel.deserializeUser());








5//Routes 
//using imported routes
app.use('/', authRoutes);






//Bootstrapping Server
//this should be the last line on this file
app.listen(port, () => console.log(`listening on port ${port}`));
