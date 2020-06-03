const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const { ensureAuthenticated } = require('../config/auth')

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

// Get users list - with search by surname
router.get('/users/:surname?', ensureAuthenticated , (req, res) => {
    session.run('MATCH(n: Person) WHERE n.surname CONTAINS $surname RETURN n;', {surname: req.params.surname ? req.params.surname : ""}).then(result => {
        const usersArr = [];
        result.records.forEach(record => {
            usersArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {friends: usersArr});
    }).catch(err => {
        console.log(err);
    });
});

//Get people that you've invited - with search by surname
router.get('/invited/:surname?', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})-[:FRIEND_WITH]->(m:Person) WHERE m.surname CONTAINS $surnameParam RETURN m;', {emailParam: req.user.records[0]._fields[0].properties.email, surnameParam: req.params.surname ? req.params.surname : ""}).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {friends: friendsArr});
    }).catch(err => {
        console.log(err);
    });
});

//Get people that've invited you - with search by surname
router.get('/invitedBy/:surname?', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})<-[:FRIEND_WITH]-(m:Person) WHERE m.surname CONTAINS $surnameParam RETURN m;', {emailParam: req.user.records[0]._fields[0].properties.email, surnameParam: req.params.surname ? req.params.surname : ""}).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {friends: friendsArr});
    }).catch(err => {
        console.log(err);
    });
});

//Get all friends - with search by surname
router.get('/friends/:surname?', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})-[:FRIEND_WITH]->(m:Person)-[:FRIEND_WITH]->(Person{email:$emailParam}) WHERE m.surname CONTAINS $surnameParam RETURN m;', {emailParam: req.user.records[0]._fields[0].properties.email, surnameParam: req.params.surname ? req.params.surname : ""}).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {friends: friendsArr});
    }).catch(err => {
        console.log(err);
    });
});

// Add to friends
router.post('/friends', ensureAuthenticated, (req, res) => {
    session.run('MATCH(n:Person{email:$emailParam}),(m:Person{email:$emailFriend}) CREATE (n)-[:FRIEND_WITH]->(m)', {emailParam: req.user.records[0]._fields[0].properties.email, emailFriend: req.body.properties.email}).then(result => {
        res.redirect('/invited');
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
});

// Add post handle
router.post('/post', ensureAuthenticated, (req, res) => {
    const value = req.body.value;
    const emailValue = req.user.records[0]._fields[0].properties.email;

    session.run('Match(p:Person{email: $emailValue}) CREATE(p)<-[:POSTED_BY]-(b:Post{value:$valueParam}) RETURN p,b ', {
        emailValue: emailValue, 
        valueParam: value
    })
    .then(() => {
        res.redirect('posts');
    })

    .catch(err => {
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


