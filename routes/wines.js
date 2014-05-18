var MongoClient = require('mongodb').MongoClient;
 
var myCollection;
var db;
 
function removeDocument(onRemove){
    myCollection.findAndModify({name: "doduck"}, [], {remove:true}, function(err, object) {
        if(err)
            throw err;
        console.log("document deleted");
        onRemove();
    });
}
 
function findDocument(onFinded){
    var cursor = myCollection.find({"name" : "doduck", "company.officialName" : "doduck LTD" });
    cursor.each(function(err, doc) {
        if(err)
            throw err;
        if(doc==null)
            return;
 
        console.log("document find:");
        console.log(doc.name);
        console.log(doc.company.employed);
        onFinded();
    });
}
 
function fieldComplexeUpdateDocument(onUpdate){
    myCollection.update({name: "doduck"}, {$set: {company: {employed: 10, officialName: "doduck LTD", industries: ["it consulting", "passionate programming"]}}}, {w:1}, function(err) {
        if(err)
            throw err;
        console.log('entry updated');
        onUpdate();
    });
}
 
function fieldUpdateDocument(onUpdate){
    myCollection.update({name: "doduck"}, {$set: {industry: "France"}}, {w:1}, function(err) {
        if(err)
            throw err;
        console.log('entry updated');
        onUpdate();
    });
}
 
function simpleUpdateDocument(onUpdate){
    myCollection.update({name: "doduck"}, {name: "doduck", description: "prototype your idea"}, {w:1}, function(err) {
    if(err)
        throw err;
        console.log('entry updated');
        onUpdate();
    });
}
 
function addDocument(onAdded){
    myCollection.insert({name: "doduck", description: "learn more than everyone"}, function(err, result) {
        if(err)
            throw err;
 
        console.log("entry saved");
        onAdded();
    });
}
 
function createConnection(onCreate){
 var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/redeenkind';
    
    MongoClient.connect(mongoUri, function(err, db) {
        if(err)
            throw err;
        console.log("connected to the mongoDB !");
        myCollection = db.collection('test_collection');
 
        onCreate();
    });
}
 
createConnection(function(){
    addDocument(function(){
        simpleUpdateDocument(function(){
            fieldUpdateDocument(function(){
                fieldComplexeUpdateDocument(function(){
                    findDocument(function(){
                        removeDocument(function(){
                            console.log("The end");
                        });
                    });
                });
            });
        });
    });
});