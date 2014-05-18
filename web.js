 var express = require('express'),
     wine = require('./routes/wines'),
     klussen = require('./routes/klussen'),
     spaardoelen = require('./routes/spaardoelen');
 
var app = express();

 
app.get('/spaardoelen', spaardoelen.findAll);
app.get('/spaardoelen/:id', spaardoelen.findById);
app.get('/wines', wine.findAll);
app.get('/wines/:id', wine.findById);
app.post('/wines', wine.addWine);
app.put('/wines/:id', wine.updateWine);
app.delete('/wines/:id', wine.deleteWine);

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

console.log('Listening on port' + port);