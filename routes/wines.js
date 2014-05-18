//var mongo = require('mongodb');

//var mongoUri = process.env.MONGOLAB_URI ||
 // process.env.MONGOHQ_URL ||
//  'mongodb://localhost:3000/winedb';

//mongo.Db.connect(mongoUri, function (err, db) {
//  db.collection('mydocs', function(er, collection) {
//    collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
//    });
//  });
//});

var MongoClient = require('mongodb').MongoClient;
 
var myCollection;
var db;

createConnection();

function createConnection(){
 var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/winedb';
    
    MongoClient.connect(mongoUri, function(err, db) {
        if(err)
            throw err;
        
        console.log("connected to the mongoDB !");

        db.collection('wines', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'wines' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
            myCollection = db.collection('wines');
        });
        
    });
}

exports.findAll = function(req, res) {
        myCollection.find().toArray(function(err, items) {
            res.send(items);
        });
};

var populateDB = function() {
 
    var wines = [
    {
        name: "CHATEAU DE SAINT COSME",
        year: "2009",
        grapes: "Grenache / Syrah",
        country: "France",
        region: "Southern Rhone",
        description: "The aromas of fruit and spice...",
        picture: "saint_cosme.jpg"
    },
    {
        name: "LAN RIOJA CRIANZA",
        year: "2006",
        grapes: "Tempranillo",
        country: "Spain",
        region: "Rioja",
        description: "A resurgence of interest in boutique vineyards...",
        picture: "lan_rioja.jpg"
    }];
 
        myCollection.insert(wines, {safe:true}, function(err, result) {});

 
};