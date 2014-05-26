
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
        myCollection = db.collection('tasks');
    
        db.collection('tasks', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'klussen' collection doesn't exist. Creating it with sample data...");
               populateDB();
            }
        });
    });
}

exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving task: ' + id);
    myCollection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
        res.send(item);
    });
  
};
 
exports.findAll = function(req, res) {
   myCollection.find().toArray(function(err, items) {
        res.send(items);
    });
};
 
 exports.addTask = function(req, res) {
    var task = req.body;
    console.log('Adding task: ' + JSON.stringify(task));
    myCollection.insert(task, {safe:true}, function(err, result) {
        if (err) {
            res.send({'error':'An error has occurred'});
        } else {
            console.log('Success: ' + JSON.stringify(result[0]));
            res.send(result[0]);
        }
    });
}
 
exports.updateTask = function(req, res) {
    var id = req.params.id;
    var task = req.body;
    console.log('Updating task: ' + id);
    console.log(JSON.stringify(task));
    myCollection.update({'_id':new BSON.ObjectID(id)}, wine, {safe:true}, function(err, result) {
        if (err) {
            console.log('Error updating task: ' + err);
            res.send({'error':'An error has occurred'});
        } else {
            console.log('' + result + ' document(s) updated');
            res.send(task);
        }
    });
}
 
exports.deleteTask = function(req, res) {
    var id = req.params.id;
    console.log('Deleting task: ' + id);
    myCollection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
        if (err) {
            res.send({'error':'An error has occurred - ' + err});
        } else {
            console.log('' + result + ' document(s) deleted');
            res.send(req.body);
        }
    });
}

function populateDB() {
    var tasks = [
    {
        "name": "Wc schoonmaken",
        "desription": "Een wc schoonmaken"
    },
    {
        "name": "Auto wassen",
        "description": "een auto wassen"
    }];
    
    myCollection.insert(tasks, function(err, result){
           if(err){
            throw err;
           }
        console.log("entry saved");
    });
};
