const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');

const app = express();

//View Engine

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

app.get('/', function (req, res){
    session
        .run('MATCH(n: Person) RETURN n;')
        .then (function(result){
            const friendsArr = [];
            result.records.forEach(function(record){
                friendsArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name,
                    surname: record._fields[0].properties.surname
                });

            });

        session
            .run('MATCH(n: Post) RETURN n;')
            .then(function(result){
                    
                const PostArr = [];
                result.records.forEach(function(record){
                    PostArr.push({
                        id: record._fields[0].identity.low,
                        value: record._fields[0].properties.value,
                        author: record._fields[0].properties.author
                    });
                });
                res.render('index', {
                    friends: friendsArr,
                    post: PostArr
                });
            })
            .catch(function(err){
                console.log(err);
            });
    })
    .catch(function(err){
        console.log(err);
        });
});

app.post('/post/add', function(req, res){
    const value = req.body.value;

    session
        .run('CREATE(n:Post {value:$valueParam}) RETURN n.value', {valueParam: value})
        .then(function(result){
            res.redirect('/');

        })
        .catch(function(err){
            console.log(err);
        });
        
});

app.post('/like', function(req, res){
    const name = req.body.name;
    const value = req.body.value;
    

    session
        .run('MATCH(a:Person {name:$nameParam}),(b: Post {value:$valueParam}) MERGE(a)-[r:LIKE]-(b) RETURN a,b', {valueParam: value, nameParam: name})
        .then(function(result){
            res.redirect('/');
        })
        .catch(function(err){
            console.log(err);
        })
});


//Routing that authenticates user - version basic looks at name and surname
app.post('/auth', function(req, res){
    const name = req.body.name.trim();
    const surname = req.body.surname.trim();

    if (name && surname) {
        session
        .run('MATCH(n: Person) WHERE n.name = $name RETURN n;', {name: name})
        .then(result => {
            if (result.records.length > null) {
                if (surname == result.records[0]._fields[0].properties.surname) {
                    res.send(`Hello ${name} ${surname}!`);
                 }else{
                     res.send(`You're not ${name}`);
                 }
            }else{
                res.send(`Użytkownik ${name} nie istnieje`)
            }

        })
    }else{
        res.send('Podaj login i hasło');
    }

});

app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;