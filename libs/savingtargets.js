var mongoose    = require('mongoose');
var log         = require('./routes/log')(module);
var config      = require('./config');

var uristring = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  config.get('mongoose:uri');

console.log("test");

mongoose.connect(uristring, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
  console.log ('Succeeded connected to: ' + uristring);
  }
});

console.log("test2");

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

// Schemas
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
    image: [Images],
    amount: { type: String, required: false }
});

// validation
SavingTarget.path('name').validate(function (v) {
    return v.length > 5 && v.length < 70;
});

var SavingTargetModel = mongoose.model('SavingTarget', SavingTarget);

module.exports.SavingTargetModel = SavingTargetModel;