const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver');
const {ensureAuthenticated} = require('../config/auth')

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

// Get users list
router.get('/users', ensureAuthenticated, (req, res) => {
    console.log(req.body.surname);
    session.run('MATCH(n: Person),(p:Person{email:$email}) WHERE NOT (n)<-[:FRIEND_WITH]-(p) RETURN n;', {
        surname: req.body.surname ? req.body.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const usersArr = [];
        result.records.forEach(record => {
            usersArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname, email: record._fields[0].properties.email});
        });
        console.log(usersArr);
        res.render('users', {
            friends: usersArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get users list - with search by surname
router.post('/users', ensureAuthenticated, (req, res) => {
    session.run('MATCH(n: Person),(p:Person{email:$email}) WHERE n.surname CONTAINS $surname AND NOT (n)<-[:FRIEND_WITH]-(p) RETURN n;', {
        surname: req.body.surname ? req.body.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const usersArr = [];
        result.records.forEach(record => {
            usersArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname, email: record._fields[0].properties.email});
        });
        res.render('users', {
            friends: usersArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Find connections
router.post('/findConnection', ensureAuthenticated, (req, res) => {
    const conArr = [];
    let target = '';
    session.run('MATCH (a:Person{email:$emailParam}),(b:Person{email:$emailFriend}), p=shortestPath((a)-[*]-(b)) RETURN p', 
    {emailParam: req.user.records[0]._fields[0].properties.email, emailFriend: req.body.email}).then(result => {
        //console.log(JSON.stringify(result.records[0]._fields[0].segments));
        target = result.records[0]._fields[0].end.properties.name+' '+result.records[0]._fields[0].end.properties.surname;
        result.records[0]._fields[0].segments.forEach(record => {
            conArr.push({startName: record.start.properties.name + " " + record.start.properties.surname, 
            relation: record.relationship.type=="FRIEND_WITH" ? "is friend with" : record.relationship.type, endName: record.end.properties.name + " " + record.end.properties.surname});
        })
        res.render('contact', {contact: conArr, user: req.user, target});
    }).catch(err => {
        console.log(err);
    });
});

// Get people that you've invited
router.get('/invited/:surname?', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})-[:FRIEND_WITH]->(m:Person) WHERE m.surname CONTAINS $surnameParam AND NOT(m.email CONTAINS $email) RETURN m;', {
        emailParam: req.user.records[0]._fields[0].properties.email,
        surnameParam: req.params.surname ? req.params.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('invited', {
            friends: friendsArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get people that you've invited - with search by surname
router.post('/invited', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})-[:FRIEND_WITH]->(m:Person) WHERE m.surname CONTAINS $surnameParam AND NOT(m.email CONTAINS $email) RETURN m;', {
        emailParam: req.user.records[0]._fields[0].properties.email,
        surnameParam: req.body.surname ? req.body.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('invited', {
            friends: friendsArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get people that've invited you - with search by surname
router.get('/invitedBy/:surname?', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})<-[:FRIEND_WITH]-(m:Person) WHERE m.surname CONTAINS $surnameParam AND NOT(m.email CONTAINS $email) RETURN m;', {
        emailParam: req.user.records[0]._fields[0].properties.email,
        surnameParam: req.params.surname ? req.params.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {
            friends: friendsArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get all friends
router.get('/friends/:surname?', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})-[:FRIEND_WITH]->(m:Person)-[:FRIEND_WITH]->(Person{email:$emailParam}) WHERE m.surname CONTAINS $surnameParam AND NOT(m.email CONTAINS $email) RETURN m;', {
        emailParam: req.user.records[0]._fields[0].properties.email,
        surnameParam: req.params.surname ? req.params.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {
            friends: friendsArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get all friends - with search by surname
router.post('/getFriends', ensureAuthenticated, (req, res) => {
    session.run('MATCH(Person{email:$emailParam})-[:FRIEND_WITH]->(m:Person)-[:FRIEND_WITH]->(Person{email:$emailParam}) WHERE m.surname CONTAINS $surnameParam AND NOT(m.email CONTAINS $email) RETURN m;', {
        emailParam: req.user.records[0]._fields[0].properties.email,
        surnameParam: req.body.surname ? req.body.surname : "",
        email: req.user.records[0]._fields[0].properties.email
    }).then(result => {
        const friendsArr = [];
        result.records.forEach(record => {
            friendsArr.push({id: record._fields[0].identity.low, name: record._fields[0].properties.name, surname: record._fields[0].properties.surname});
        });
        res.render('friends', {
            friends: friendsArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Add to friends
router.post('/friends', ensureAuthenticated, (req, res) => {
    session.run('MATCH(n:Person{email:$emailParam}),(m:Person{email:$emailFriend}) CREATE (n)-[:FRIEND_WITH]->(m)', {
        emailParam: req.user.records[0]._fields[0].properties.email,
        emailFriend: req.body.emailFriend
    }).then(result => {
        res.redirect('/user/invited');
    }).catch(err => {
        console.log(err);
    });
});

// Get posts of your friends
router.get('/posts', ensureAuthenticated, (req, res) => {
    session.run('MATCH(n: Post)-[:POSTED_BY]->(p:Person)<-[:FRIEND_WITH]-(m:Person{email: $emailValue}) OPTIONAL MATCH ()-[r:LIKE]->(n)-[:POSTED_BY]->(p)<-[:FRIEND_WITH]-(m) RETURN n, p, COUNT(r) ORDER BY n.date DESC;', {emailValue: req.user.records[0]._fields[0].properties.email}).then(result => {
        const postsArr = [];
        result.records.forEach(record => {
            postsArr.push({
                id: record._fields[0].identity.low,
                value: record._fields[0].properties.value,
                date: record._fields[0].properties.date,
                surname: record._fields[1].properties.surname,
                name: record._fields[1].properties.name,
                likes: record._fields[2].low
            });
        });
        res.render('posts', {
            post: postsArr,
            user: req.user
        });
    }).catch(err => {
        console.log(err);
    });
});

// Get form to add posts
router.get('/post', ensureAuthenticated, (req, res) => {
    res.render('addPost', {user: req.user});
});

// Add post handle
router.post('/post', ensureAuthenticated, (req, res) => {
    const value = req.body.value;
    const emailValue = req.user.records[0]._fields[0].properties.email;
    const today = new Date();
    let day = today.getDate(),
        month = today.getMonth(),
        year = today.getFullYear(),
        time = today.getHours() + ":" + today.getMinutes();

    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }

    session.run('Match(p:Person{email: $emailValue}) CREATE(p)<-[:POSTED_BY]-(b:Post{value:$valueParam, date:$dateValue}) RETURN p,b ', {
        emailValue: emailValue,
        valueParam: value,
        dateValue: time + " " + day + '-' + month + '-' + year
    }).then(() => {
        res.redirect('posts');
    }).catch(err => {
        console.log(err);
    });
});

// Like post
router.post('/like', ensureAuthenticated, (req, res) => {
    session.run('MATCH(p:Post{value: $postValue})<-[r:LIKE]-(m:Person{email: $emailValue}) RETURN COUNT(r)', {
        emailValue: req.user.records[0]._fields[0].properties.email,
        postValue: req.body.value
    }).then(result => {
        if (result.records[0]._fields[0].low == 0) {
            session.run('MATCH(p:Post{value: $postValue}), (m:Person{email: $emailValue}) CREATE (p)<-[:LIKE]-(m) RETURN p,m', {
                emailValue: req.user.records[0]._fields[0].properties.email,
                postValue: req.body.value
            }).then(result => {
                res.redirect('posts');
            }).catch(err => {
                console.log(err);
            });
        } else {
            session.run('MATCH(p:Post{value: $postValue})<-[r:LIKE]-(m:Person{email: $emailValue}) DELETE r', {
                emailValue: req.user.records[0]._fields[0].properties.email,
                postValue: req.body.value
            }).then(result => {
                res.redirect('posts');
            }).catch(err => {
                console.log(err);
            });
        }
        res.redirect('posts');
    }).catch(err => {
        console.log(err);
    });
});

// Render email site
router.get('/email', ensureAuthenticated, (req, res) => {
    res.render('email', {user: req.user});
});

// Change email
router.post('/email', ensureAuthenticated, (req, res) => {
    session.run('MATCH (p:Person{email:$emailValue}) RETURN COUNT(p)', {emailValue: req.body.newEmail}).then(result => {
        console.log(result.records[0]._fields[0].low);
        if (result.records[0]._fields[0].low == 0) {
            session.run('MATCH(n:Person{email:$emailValue}) SET n.email = $newEmail', {
                emailValue: req.user.records[0]._fields[0].properties.email,
                newEmail: req.body.newEmail
            }).then(result => {
                res.redirect('logout');
            }).catch(err => {
                console.log(err);
            });
        }else{ res.redirect('/user/email'); }
    });
});

// Logout handle
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

module.exports = router;
