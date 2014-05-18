
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient; 
var myCollection;
var db;
var BSON = mongo.BSONPure;

createConnection();

function createConnection(){
    
    var mongoUri = process.env.MONGOLAB_URI ||
        process.env.MONGOHQ_URL ||
        'mongodb://localhost:27017/winedb';
    
    MongoClient.connect(mongoUri, function(err, db) {
        if(err)
            throw err;
        
        console.log("connected to the mongoDB !");
        myCollection = db.collection('spaardoelen');
    
        db.collection('spaardoelen', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'spaardoelen' collection doesn't exist. Creating it with sample data...");
               populateDB();
            }
        });
    });
}

exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving spaardoel: ' + id);
    myCollection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
        res.send(item);
    });
  
};
 
exports.findAll = function(req, res) {
   myCollection.find().toArray(function(err, items) {
        res.send(items);
    });
};
 
/* exports.addWine = function(req, res) {
    var wine = req.body;
    console.log('Adding wine: ' + JSON.stringify(wine));
    myCollection.insert(wine, {safe:true}, function(err, result) {
        if (err) {
            res.send({'error':'An error has occurred'});
        } else {
            console.log('Success: ' + JSON.stringify(result[0]));
            res.send(result[0]);
        }
    });
}
 
exports.updateWine = function(req, res) {
    var id = req.params.id;
    var wine = req.body;
    console.log('Updating wine: ' + id);
    console.log(JSON.stringify(wine));
    myCollection.update({'_id':new BSON.ObjectID(id)}, wine, {safe:true}, function(err, result) {
        if (err) {
            console.log('Error updating wine: ' + err);
            res.send({'error':'An error has occurred'});
        } else {
            console.log('' + result + ' document(s) updated');
            res.send(wine);
        }
    });
}
 
exports.deleteWine = function(req, res) {
    var id = req.params.id;
    console.log('Deleting wine: ' + id);
    myCollection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
        if (err) {
            res.send({'error':'An error has occurred - ' + err});
        } else {
            console.log('' + result + ' document(s) deleted');
            res.send(req.body);
        }
    });
}*/

function populateDB() {
    var spaardoelen = [
    {
        "name": "Kip",
        "description": "Een kip legt lekkere eieren en is goed te eten",
        "amount": "5"
    },
    {
        "name": "Waterput",
        "description": "Een waterput zorgt voor lekker water",
        "amount": "150"
    }];
    
    myCollection.insert(spaardoelen, function(err, result){
           if(err){
            throw err;
           }
        console.log("entry saved");
    });
};
