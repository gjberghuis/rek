 var express = require('express'),
     app = express(),
     log = require('./libs/log')(module),
     config = require('./libs/config'),
     basicAuth = require('basic-auth'),    
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
     http = require('http');

app.use(bodyParser()); // JSON parsing
app.use(methodOverride()); // HTTP PUT and DELETE support
//app.use(app.router); // simple route management
//app.use(express.static(path.join(__dirname, "public"))); // starting static fileserver, that will watch `public` folder (in our case there will be `index.html`)




app.all('*', function(req, res, next) {
    
    
          var authheader = req.headers['authorization'];  // auth is in base64(username:password)  so we need to decode the base64
        console.log("Authorization Header is: ", authheader);
    
if (req.method === 'OPTIONS') {
      console.log('!OPTIONS');
      var headers = {};
      // IE8 does not allow domains to be specified, just the *
      // headers["Access-Control-Allow-Origin"] = req.headers.origin;
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
     headers["Access-Control-Allow-Credentials "] = "true"; // 24 hours
      headers["Access-Control-Max-Age"] = '86400'; // 24 hours
      headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Authorization, Accept";
      res.writeHead(200, headers);
      res.end();
} 
    else {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');    
        res.header["Access-Control-Max-Age"] = '86400'; // 24 hours
      res.header["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization";
 res.header["Access-Control-Allow-Credentials "] = "true"; // 24 hours
  next();
    }
});
 
 

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


/*
* SavingTargets
*/

var SavingTargetModel= require('./routes/mongoose').SavingTargetModel;
app.get('/savingtargets', function(req, res) {
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
});

app.post('/savingtargets', auth, function(req, res) {
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
});
 
app.get('/savingtargets/:id', auth, function(req, res) {
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
});

app.put('/savingtargets/:id', auth, function (req, res){
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
});   

app.delete('/savingtargets/:id', auth, function (req, res){
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

var TaskModel = require('./routes/mongoose').TaskModel;

app.get('/tasks', function(req, res) {
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
 
app.get('/tasks/:id', auth, function(req, res) {
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

var UserModel = require('./routes/mongoose').UserModel;

app.get('/users', auth, function(req, res) {
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

app.post('/users', auth, function(req, res) {
    console.log(req.body);
    var user = new UserModel({
        firstname: req.body.firstname,
        name: req.body.name,
        email: req.body.email,
        registration_date: req.body.registration_date,
        savingtargets : req.body.savingtargets
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
 
app.get('/users/:id', auth, function(req, res) {
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
                                        task['description'] = q.description;
                                           task['amount'] = q.amount
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
});
            
app.put('/users/:id', auth, function (req, res){
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

app.delete('/users/:id', auth, function (req, res){
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