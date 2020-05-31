const LocalStrategy = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    neo4j = require('neo4j-driver');

const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
const session = driver.session();

module.exports = function(passport) {
    passport.use(new LocalStrategy({usernameField: 'email'}, (username, password, done) => {
        session.run('MATCH(n: Person) WHERE n.email = $email RETURN n', {email: username}).then(user => {
            if (!user) {
                return done(null, false, {message: 'That email is not registered'});
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
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
        done(null, user.id);
    });
    
    passport.deserializeUser((id, done) => {
        session
        .run('MATCH(n: Person) WHERE n.id = $id RETURN n', {id: id})
        .then((err, user) => {
            done(err,user);
        })
        .catch(err => { if(err) throw err;});
    });
};

