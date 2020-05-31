const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const { ensureAuthenticated } = require('../config/auth')

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

// Get friends list - version beta / gets all users
router.get('/friends', ensureAuthenticated , (req, res) => {
    session.run('MATCH(n: Person) RETURN n;').then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
            res.render('friends', {friends: friendsArr});
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get posts - version beta / gets posts of all users
router.get('/posts', ensureAuthenticated, (req, res) => {
    const friendsArr = [];

    session.run('MATCH(n: Person) RETURN n;').then(result => {
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        session.run('MATCH(n: Post) RETURN n;').then(result => {
            const PostArr = [];
            result.records.forEach(record => {
                PostArr.push({id: record._fields[0].identity.low, value: record._fields[0].properties.value, author: record._fields[0].properties.author});
            });
            res.render('posts', {
                friends: friendsArr,
                post: PostArr
            });
        }).catch(err => {
            console.log(err);
        });
    });


});

// Get form to add posts
router.get('/post', ensureAuthenticated, (req, res) => {
    res.render('addPost', { user: req.user });
})

// Add post handle
router.post('/post', ensureAuthenticated, (req, res) => {
    const value = req.body.value;
    const author = req.body.author;

    session.run('CREATE(n:Post {value:$valueParam, author:$authorParam}) RETURN n.value', {
        valueParam: value,
        authorParam: author
    }).then(result => {
        res.redirect('posts');
    }).catch(err => {
        console.log(err);
    });
});

// Get dashboard(mainscreen)
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', {
        user: req.user
    });
});

// Logout handle
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});
module.exports = router;
