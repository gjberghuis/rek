var express = require('express'),
    app = express(),
    log = require('./libs/log')(module),
    config = require('./libs/config'),
    bodyParser = require('body-parser'),
    path = require('path'),
    methodOverride = require('method-override'),
    http = require('http');
var auth = require("http-auth");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hat = require('hat');

//test/
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser()); // JSON parsing
app.use(methodOverride()); // HTTP PUT and DELETE support
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function(req, res, next) {
    if (req.method === 'OPTIONS') {

        var headers = {};
        // IE8 does not allow domains to be specified, just the *
        // headers["Access-Control-Allow-Origin"] = req.headers.origin;
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials "] = "true"; // 24 hours
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, Authorization, Content-Type";
        res.writeHead(200, headers);
        res.end();
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With, Authorization, Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Credentials", "true"); // 24 hours  
        next();
    }
});

/*
 * SavingTargets
 */

var SavingTargetModel= require('./routes/mongoose').SavingTargetModel;

app.get('/savingtargets', function(req, res) {
    if (validTokenProvided(req, res)) {
        return SavingTargetModel.find({}).sort('name').lean().exec(function(err, savingtargets){
            if(!err) {
                return res.jsonp({ savingtargets:savingtargets });
            }
            else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.jsonp({ error: 'Server error' });
            }
        });
    }
});

app.post('/savingtargets', function(req, res) {
    if (validTokenProvided(req, res)) {

        var savingtarget = new SavingTargetModel({

            name: req.body.name,
            short_description: req.body.short_description,
            description: req.body.description,
            images: req.body.images,
            amount: req.body.amount
        });

        savingtarget.save(function (err) {
            if (!err) {
                log.info("savingtarget created");
                return res.jsonp({ status: 'OK', savingtarget:savingtarget });
            } else {
                console.log(err);
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.jsonp({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.jsonp({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    }
});

app.get('/savingtargets/:id', function(req, res) {
    if (validTokenProvided(req, res)) {
        return SavingTargetModel.findById(req.params.id, function (err, savingtarget) {
            if(!savingtarget) {
                res.statusCode = 404;
                return res.jsonp({ error: 'Not found' });
            }
            if (!err) {
                return res.jsonp({ savingtarget:savingtarget });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    }
});

app.put('/savingtargets/:id', function (req, res){
    if (validTokenProvided(req, res)) {
        return SavingTargetModel.findById(req.params.id, function (err, savingtarget) {
            if(!savingtarget) {
                res.statusCode = 404;
                return res.jsonp({ error: 'Not found' });
            }

            savingtarget.name = req.body.name;
            savingtarget.description = req.body.description;
            savingtarget.short_description = req.body.short_description;
            savingtarget.images = req.body.images;
            savingtarget.amount = req.body.amount;

            return savingtarget.save(function (err) {
                if (!err) {
                    log.info("savingtarget updated");
                    return res.jsonp({ status: 'OK', savingtarget:savingtarget });
                } else {
                    if(err.name == 'ValidationError') {
                        res.statusCode = 400;
                        res.jsonp({ error: 'Validation error' });
                    } else {
                        res.statusCode = 500;
                        res.jsonp({ error: 'Server error' });
                    }
                    log.error('Internal error(%d): %s',res.statusCode,err.message);
                }
            });
        });
    }
});

app.delete('/savingtargets/:id', function (req, res){
    return SavingTargetModel.findById(req.params.id, function (err, savingtarget) {
        if(!savingtarget) {
            res.statusCode = 404;
            return res.jsonp({ error: 'Not found' });
        }
        return savingtarget.remove(function (err) {
            if (!err) {
                log.info("savingtarget removed");
                return res.jsonp({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.jsonp({ error: 'Server error' });
            }
        });
    });
});

/*
 * Tasks
 */

var TaskModel = require('./routes/mongoose').TaskModel;

app.get('/tasks', function(req, res) {
    if (validTokenProvided(req, res)) {
        return TaskModel.find(function(err, tasks){
            if(!err) {
                return res.jsonp({ tasks:tasks });
            }
            else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.jsonp({ error: 'Server error' });
            }
        });
    }
});

app.post('/tasks', function(req, res) {
    var task = new TaskModel({
        name: req.body.name,
        short_description: req.body.short_description,
        description: req.body.description
    });

    task.save(function (err) {
        if (!err) {
            log.info("task created");
            return res.jsonp({ status: 'OK', task:task });
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.jsonp({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.jsonp({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });
});

app.get('/tasks/:id', function(req, res) {
    if (validTokenProvided(req, res)) {
        return TaskModel.findById(req.params.id, function (err, tasks) {
            if(!tasks) {
                res.statusCode = 404;
                return res.jsonp({ error: 'Not found' });
            }
            if (!err) {
                return res.jsonp({ task:tasks });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.jsonp({ error: 'Server error' });
            }
        });
    }
});

app.put('/tasks/:id', function (req, res){
    return TaskModel.findById(req.params.id, function (err, task) {
        if(!task) {
            res.statusCode = 404;
            return res.jsonp({ error: 'Not found' });
        }

        task.name = req.body.name;
        task.description = req.body.description;
        task.short_description = req.body.short_description;

        return task.save(function (err) {
            if (!err) {
                log.info("task updated");
                return res.jsonp({ status: 'OK', task:task });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.jsonp({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.jsonp({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});

app.delete('/task/:id', function (req, res){
    return TaskModel.findById(req.params.id, function (err, task) {
        if(!task) {
            res.statusCode = 404;
            return res.jsonp({ error: 'Not found' });
        }
        return task.remove(function (err) {
            if (!err) {
                log.info("task removed");
                return res.jsonp({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.jsonp({ error: 'Server error' });
            }
        });
    });
});

/*
 * Users
 */

var UserModel = require('./routes/mongoose').UserModel;

app.get('/users', function(req, res) {
    return UserModel.find(function(err, users){
        if(!err) {
            return res.jsonp({ users:users });
        }
        else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.jsonp({ error: 'Server error' });
        }
    });
});

app.post('/users', function(req, res) {
    var user = new UserModel({
        firstname: req.body.firstname,
        name: req.body.name,
        email: req.body.email,
        registration_date: req.body.registration_date,
        savingtargets : req.body.savingtargets,
        password: req.body.password
    });

    user.save(function (err) {
        if (!err) {
            log.info("user created");
            return res.send({ status: 'OK', user:user });
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });
});

app.get('/users/:id', function(req, res) {
    //  if (validTokenProvided(req, res)) {
    if(req.query.resolve != null)
    {
        var userModel = UserModel.findById(req.params.id).lean().exec(function (err, user) {
            if(!user) {
                res.statusCode = 404;
                return res.jsonp({ error: 'Not found' });
            }
            if (!err) {
                if(user.savingtargets != null && user.savingtargets != 'undefined' && user.savingtargets.length > 0)
                {
                    var len = user.savingtargets.length;
                    var counter = 0;
                    user.savingtargets.forEach(function(savingtarget){
                        console.log(savingtarget['savingtarget_id']);
                        if(savingtarget.tasks.length > 0)
                        {
                            savingtarget.tasks.forEach(function(task){
                                TaskModel.findById(task['task_id']).lean().exec(function(err, q){
                                    if(q)
                                    {
                                        task['name'] = q.name;
                                        task['description'] = q.description
                                    }
                                    else{
                                        console.log("task with id: " + task['task_id'] + " not founded");
                                    }
                                });
                            });
                        }
                        SavingTargetModel.findById(savingtarget['savingtarget_id']).lean().exec(function(err, q){
                            if(q)
                            {
                                savingtarget['name'] = q.name;
                                savingtarget['description'] = q.description;
                                savingtarget['short_description'] = q.short_description;
                                savingtarget['amount'] = q.amount;
                                savingtarget['images'] = q.images;
                            }
                            else{
                                console.log("savingtarget with id: " + savingtarget['savingtarget_id'] + " not founded");
                            }
                            if(++counter == len) {
                                res.jsonp({ 'user':user});
                            }
                        });
                    });
                }
                else {
                    res.jsonp({ 'user':user});
                }
            }
        });
    }
    else {
        return UserModel.findById(req.params.id, function (err, user) {
            if(!user) {
                res.statusCode = 404;
                return res.jsonp({ error: 'Not found' });
            }
            if (!err) {
                return res.jsonp({ user:user});
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.jsonp({ error: 'Server error' });
            }
        });
    }
    //  }
});

app.put('/users/:id', function (req, res){
    var userModel = UserModel.findById(req.params.id, function (err, user) {
        if(!user) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        user.firstname = req.body.firstname;
        user.name = req.body.name;
        user.email = req.body.email;
        user.registration_date = req.body.registration_date;
        user.savingtargets = req.body.savingtargets;
        user.password = req.body.password;

        return user.save(function (err) {
            if (!err) {
                log.info("user updated");
                return res.send({ status: 'OK', user:user });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });

    return userModel;
});

app.delete('/users/:id', function (req, res){
    return UserModel.findById(req.params.id, function (err, user) {
        if(!user) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return user.remove(function (err) {
            if (!err) {
                log.info("user removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

/*
 * Passport js authentication
 */

app.get('/login', function(req, res) {
    res.sendfile('views/login.html');
});

/*app.post('/login',
 passport.authenticate('local', {
 successRedirect: '/loginSuccess',
 failureRedirect: '/loginFailure'
 })
 );*/

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        debugger;
        if (err) { return next(err); }

        if (!user) { return res.redirect('/'); }

        req.logIn(user, function(err) {
            debugger;
            if (err) { return next(err); }
            currentToken = hat();
            return res.send({
                userid: user._doc._id.toString(),
                success: true,
                token: currentToken
            });
        });
    })(req, res, next);
});

var currentToken;
app.get('/loginFailure', function(req, res, next) {
    res.send({
        success: false,
        message: 'Failed to authenticate'
    });
});

app.get('/loginSuccess', function(req, res, next) {
    debugger;
    currentToken = hat();
    res.send({
        success: true,
        token: currentToken
    });
});

function validTokenProvided(req, res) {

    // Check POST, GET, and headers for supplied token.
    var userToken = req.body.token || req.param('token') || req.headers.token;

    if (!currentToken || userToken != currentToken) {
        res.send(401, { error: 'Invalid token. You provided: ' + userToken });
        return false;
    }

    return true;
}

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new LocalStrategy(function(email, password, done) {
    process.nextTick(function() {
        UserModel.findOne({
            'email': email
        }, function(err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            if (user.password != password) {
                return done(null, false);
            }
            return done(null, user);
        });
    });
}));

var port = Number(process.env.PORT || config.get('port'));
app.listen(port, function(){
    log.info('Express server listening on port ' + port);
});

app.use(function(req, res, next){
    res.status(404);
    log.debug('Not found URL: %s',req.url);
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
    return;
});

app.get('/ErrorExample', function(req, res, next){
    next(new Error('Random error!'));
});