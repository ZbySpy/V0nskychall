const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const bcrypt = require('bcrypt');
const passport = require('passport');

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

// Get register screen
router.get('/register', (req, res) => {
    res.render('register');
});

// Register to website
router.post('/register', async (req, res) =>{
    const name = req.body.name.trim();
    const surname = req.body.surname.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (!name || !surname || !email || !password) {
        res.render('register');
    }
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        
        session
        .run('CREATE(n:Person {name:$name, surname:$surname, email:$email, password:$password}) RETURN n', {name:name, surname:surname, email:email, password:hashedPassword})
        .then(() => {
            session.run('MATCH(n:Person{email:$emailParam}),(m:Person{email:$emailParam}) CREATE (n)-[:FRIEND_WITH]->(m)', {emailParam: email}).then(result => {
                res.render('login');
            }).catch(err => {
                console.log(err); 
            });                  
        });
    } catch (error) {
        res.status(500).send();
    }
});

// Get login screen
router.get('/login', (req, res) => {
    res.render('login');
});

// Login handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/user/posts',
        failureRedirect: '/login'
    })(req, res, next);
});



module.exports = router;