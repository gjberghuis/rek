

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
         db.collection('mydocs', function(er, collection) {
    collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
    });
  });
        
        console.log("connected to the mongoDB !");
        myCollection = db.collection('wines');
    
        db.collection('wines', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'wines' collection doesn't exist. Creating it with sample data...");
               populateDB();
            }
        });
    });
}

exports.findAll = function(req, res) {
        myCollection.find().toArray(function(err, items) {
            res.send(items);
        });
};

function addDocument(onAdded){
    myCollection.insert({name: "doduck", description: "learn more than everyone"}, function(err, result) {
        if(err)
            throw err;
 
        console.log("entry saved");
        onAdded();
    });
}

function populateDB() {   
    var wines = [
    {
        "name": "CHATEAU DE SAINT COSME",
        "year": "2009",
        "grapes": "Grenache / Syrah",
        "country": "France",
        "region": "Southern Rhone",
        "description": "The aromas of fruit and spice...",
        "picture": "saint_cosme.jpg"
    },
    {
        "name": "LAN RIOJA CRIANZA",
        "year": "2006",
        "grapes": "Tempranillo",
        "country": "Spain",
        "region": "Rioja",
        "description": "A resurgence of interest in boutique vineyards...",
        "picture": "lan_rioja.jpg"
    }];
    
    myCollection.insert(wines, function(err, result){
           if(err){
            throw err;
           }
        console.log("entry saved");
    });
};
