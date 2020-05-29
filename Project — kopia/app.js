var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');

var app = express();

//View Engine

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
var session = driver.session();

app.get('/', function (req, res){
    session
        .run('MATCH(n: Person) RETURN n;')
        .then (function(result){
            var friendsArr = [];
            result.records.forEach(function(record){
                friendsArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name,
                    surname: record._fields[0].properties.surname
                });

            });

        session
            .run('MATCH(n: Post) RETURN n;')
            .then(function(result2){
                    
                var PostArr = [];
                result2.records.forEach(function(record){
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
    var value = req.body.value;
    var author = req.body.author;

    session
        .run('CREATE(n:Post {value:$valueParam, author:$authorParam}) RETURN n.value', {valueParam: value, authorParam: author})
        .then(function(result){
            res.redirect('/');

            session.close();
        })
        .catch(function(err){
            console.log(err);
        });


});

app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;