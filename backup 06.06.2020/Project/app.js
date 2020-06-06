const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');
const bcrypt = require('bcrypt');
const exSession = require('express-session');

const app = express(),
 passport = require('passport');

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

// Passport config
require('./config/passport')(passport);

//View Engine

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Express session
app.use(
    exSession({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
);

// Passport middleware 
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', require('./routes/indexRouter'));
app.use('/user', require('./routes/userRouter'));

app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;