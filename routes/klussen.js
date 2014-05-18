
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
        myCollection = db.collection('klussen');
    
        db.collection('klussen', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'klussen' collection doesn't exist. Creating it with sample data...");
               populateDB();
            }
        });
    });
}

exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving klus: ' + id);
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
    var klussen = [
    {
        "name": "Wc schoonmaken",
        "by": "Berry",
        "amount": "1",
        "deadine": "12/07/2014"
    },
    {
        "name": "Auto wassen",
        "by": "Judith",
        "amount": "1,50",
        "deadine": "01/05/2014"
    }];
    
    myCollection.insert(klussen, function(err, result){
           if(err){
            throw err;
           }
        console.log("entry saved");
    });
};
