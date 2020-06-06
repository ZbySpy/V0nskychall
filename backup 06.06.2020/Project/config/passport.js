const LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    neo4j = require('neo4j-driver');

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

module.exports = function(passport) {
    passport.use(new LocalStrategy({usernameField: 'email'}, (username, password, done) => {
        console.log(`${username}/${password}`);
        session.run('MATCH(n: Person) WHERE n.email = $email RETURN n', {email: username}).then(user => {
            //console.log(user);
            if (user.records.length < 1) {
                return done(null, false, {message: 'That email is not registered'});
            }
            bcrypt.compare(password, user.records[0]._fields[0].properties.password, (err, isMatch) => {
                if (err) 
                    throw err;
                
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {message: 'Password incorrect'});
                }
            });
        }).catch(err => {
            if (err) 
                throw err;
            
        });
    }));
    
    passport.serializeUser((user, done) => {
        //console.log(user.records[0]._fields[0].properties.email);
        done(null, user.records[0]._fields[0].properties.email);
    });
    
    passport.deserializeUser((email, done) => {
        console.log(`Deserialize: ${email}`);
        session
        .run('MATCH(n: Person) WHERE n.email = $email RETURN n', {email: email})
        .then((user) => {
            done(null, user);
        })
        .catch(err => { if(err) throw err;});
    });
};

