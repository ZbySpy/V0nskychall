const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');
const bcrypt = require('bcrypt');

const app = express();

//View Engine

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/views'));

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
            .then(function(result2){
                    
                const PostArr = [];
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
    const value = req.body.value;
    const author = req.body.author;

    session
        .run('CREATE(n:Post {value:$valueParam, author:$authorParam}) RETURN n.value', {valueParam: value, authorParam: author})
        .then(function(result){
            res.redirect('/');
        })
        .catch(function(err){
            console.log(err);
        });
});


//Routing that authenticates user - version basic looks at name and surname
app.post('/auth', function(req, res){
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (email && password) {
        session
        .run('MATCH(n: Person) WHERE n.email = $email RETURN n;', {email: email})
        .then(result => {
            if (result.records.length < 0) {
                res.send(res.send(`Użytkownik ${email} nie istnieje`));
            }
            try {
                if(bcrypt.compare(password, result.records[0]._fields[0].properties.password)){
                    res.send(`Witaj ${email}!`);
                }else{
                    res.send('Login lub hasło są nieprawidłowe');
                }
            } catch {
                res.statusCode(500).send();
            }    

            })
        }else{
            res.send('Podaj login i hasło');
        }
});

app.post('/register', async function(req, res){
    const name = req.body.name.trim();
    const surname = req.body.surname.trim();
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        
        session
        .run('CREATE(n:Person {name:$name, surname:$surname, email:$email, password:$password}) RETURN n', {name:name, surname:surname, email:email, password:hashedPassword})
        .then(function(result){
            res.send(`Witaj ${result.records[0]._fields[0].properties.name} ${result.records[0]._fields[0].properties.surname}`);
        });
    } catch (error) {
        res.status(500).send();
    }
});

app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;