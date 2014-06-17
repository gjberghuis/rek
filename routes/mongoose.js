var mongoose    = require('mongoose');
var log         = require('../libs/log')(module);
var config      = require('../libs/config');

var uristring = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  config.get('mongoose:uri');

/*
* Database connection using mongoose
*/

mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

/*
* SavingTargets schema & model
*/

var Images = new Schema({
    kind: {
        type: String,
        enum: ['thumbnail', 'detail'],
        required: false
    },
    url: { type: String, required: false }
});

var SavingTarget = new Schema({
    name: { type: String, required: true },
    short_description: { type: String, required: true },
    description: { type: String, required: false },
    amount: { type: String, required: false },
    images: [Images],
});

// validation
SavingTarget.path('name').validate(function (v) {
    return v.length > 2 && v.length < 70;
});

var SavingTargetModel = mongoose.model('SavingTarget', SavingTarget);

module.exports.SavingTargetModel = SavingTargetModel;

/*
* Tasks schema & model
*/

var Task = new Schema({
    name: { type: String, required: true },
    short_description: { type: String, required: true },
    description: { type: String, required: false }
});

// validation
Task.path('name').validate(function (v) {
    return v.length > 2 && v.length < 70;
});

var TaskModel = mongoose.model('Task', Task);

module.exports.TaskModel = TaskModel;

/*
* Users schema & model
*/

var Tasks = new Schema({
    task_id: { type: String, required: true },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, required: false },
    completed : { type: Boolean, default: false },
    amount : { type: String, required: false }
});

var SavingTargets = new Schema({
    savingtarget_id: { type: String, required: true },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, required: false },
    completed : { type: Boolean, default: false },
    tasks: [Tasks]
});

var User = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true},
    firstname: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    registration_date: { type: String, required: false },
    savingtargets: [SavingTargets],
});
 
// Bcrypt middleware on UserSchema
User.pre('save', function(next) {
  var user = this;
 
  if (!user.isModified('password')) return next();
 
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);
 
    bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
    });
  });
});
 
//Password verification
User.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(isMatch);
    });
};

// validation
User.path('name').validate(function (v) {
    return v.length > 2 && v.length < 70;
});

/*User.path('email').validate(function (email) {
   var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
   return emailRegex.test(email.text); // Assuming email has a text attribute
}, 'The e-mail field cannot be empty.')
*/

exports.login = function(req, res) {
    var username = req.body.username || '';
    var password = req.body.password || '';
 
    if (username == '' || password == '') {
        return res.send(401);
    }
 
    db.userModel.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.send(401);
        }
 
        user.comparePassword(password, function(isMatch) {
            if (!isMatch) {
                console.log("Attempt failed to login with " + user.username);
                return res.send(401);
            }
 
            var token = jwt.sign(user, secret.secretToken, { expiresInMinutes: 60 });
 
            return res.json({token:token});
        });
 
    });
};
var UserModel = mongoose.model('User', User);

module.exports.UserModel = UserModel;