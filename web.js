 var express = require('express'),
     app = express(),
     tasks = require('./routes/tasks'),
     log = require('./libs/log')(module),
     config = require('./libs/config'),
     basicAuth = require('basic-auth'),    
    bodyParser = require('body-parser');
    methodOverride = require('method-override');

app.use(bodyParser()); // JSON parsing
app.use(methodOverride()); // HTTP PUT and DELETE support
//app.use(app.router); // simple route management
//app.use(express.static(path.join(__dirname, "public"))); // starting static fileserver, that will watch `public` folder (in our case there will be `index.html`)

 

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'foo' && user.pass === 'bar') {
    return next();
  } else {
    return unauthorized(res);
  };
}

    
var SavingTargetModel= require('./routes/savingtargets').SavingTargetModel;

app.get('/savingtargets', function(req, res) {
    return SavingTargetModel.find(function(err, savingtargets){
        if(!err) {
            return res.send(savingtargets);
        }
        else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }    
    });
});

app.post('/savingtargets', function(req, res) {
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
            return res.send({ status: 'OK', savingtarget:savingtarget });
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
 
app.get('/savingtargets/:id', function(req, res) {
        return SavingTargetModel.findById(req.params.id, function (err, savingtarget) {
        if(!savingtarget) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', savingtarget:savingtarget });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/savingtargets/:id', function (req, res){
        return SavingTargetModel.findById(req.params.id, function (err, savingtarget) {
        if(!savingtarget) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        savingtarget.name = req.body.name;
        savingtarget.description = req.body.description;
        savingtarget.short_description = req.body.short_description;
        savingtarget.images = req.body.images;
        savingtarget.amount = req.body.amount;
            
        return savingtarget.save(function (err) {
            if (!err) {
                log.info("savingtarget updated");
                return res.send({ status: 'OK', savingtarget:savingtarget });
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
});   

app.delete('/savingtargets/:id', function (req, res){
       return SavingTargetModel.findById(req.params.id, function (err, savingtarget) {
        if(!savingtarget) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return savingtarget.remove(function (err) {
            if (!err) {
                log.info("savingtarget removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

var TaskModel = require('./routes/savingtargets').TaskModel;

app.get('/tasks', function(req, res) {
    return TaskModel.find(function(err, tasks){
        if(!err) {
            return res.send(tasks);
        }
        else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }    
    });
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
            return res.send({ status: 'OK', task:task });
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
 
app.get('/tasks/:id', function(req, res) {
        return TaskModel.findById(req.params.id, function (err, tasks) {
        if(!tasks) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', tasks:tasks });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/tasks/:id', function (req, res){
        return TaskModel.findById(req.params.id, function (err, task) {
        if(!task) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        task.name = req.body.name;
        task.description = req.body.description;
        task.short_description = req.body.short_description;
            
        return task.save(function (err) {
            if (!err) {
                log.info("task updated");
                return res.send({ status: 'OK', task:task });
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
});   

app.delete('/task/:id', function (req, res){
       return TaskModel.findById(req.params.id, function (err, task) {
        if(!task) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return task.remove(function (err) {
            if (!err) {
                log.info("task removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

var UserModel = require('./routes/savingtargets').UserModel;

app.get('/users', function(req, res) {
    return UserModel.find(function(err, users){
        if(!err) {
            return res.send(users);
        }
        else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }    
    });
});

app.post('/users', function(req, res) {
    console.log(req.body);
    var user = new UserModel({
        firstname: req.body.firstname,
        name: req.body.name,
        email: req.body.email,
        registration_date: req.body.registration_date
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
        return UserModel.findById(req.params.id, function (err, users) {
        if(!users) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', users:users });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/users/:id', function (req, res){
        return UserModel.findById(req.params.id, function (err, user) {
        if(!user) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        user.firstname = req.body.firstname;
        user.name = req.body.name;
        user.email = req.body.email;
        user.registration_date = req.body.registration_date;
            
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