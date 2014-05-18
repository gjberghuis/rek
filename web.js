// web.js
/*var express = require("express");
var wines = require('./routes/wines');
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.get('/wines', wines.findAll);
app.get('/wines/:id', wines.findById);

var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});*/


 
var express = require('express'),
    wine = require('./routes/wines');
 
var app = express();

 
app.get('/wines', wine.findAll);
app.get('/wines/:id', wine.findById);
app.post('/wines', wine.addWine);
app.put('/wines/:id', wine.updateWine);
app.delete('/wines/:id', wine.deleteWine);
 
app.listen(3000);
console.log('Listening on port 3000...');