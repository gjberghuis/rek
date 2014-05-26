var mongoose    = require('mongoose');
var log         = require('./routes/log')(module);
var config      = require('./config');

mongoose.connect(config.get('mongoose:uri'));

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