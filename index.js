require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


/*************************************************/
// microservice
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

let shorturlScheme = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
let Shorturl = mongoose.model('Shorturl', shorturlScheme);


function isValidUrl(urlString) {
  let urlPattern = new RegExp('^(https|http):\\/\\/(www\.)?');
  return urlPattern.test(urlString);
}

function createShorturl(url, shorturl) {
  Shorturl.create([{ original_url: url, short_url: shorturl }], 
    function(err, data) {
      if (err) return console.error(err);
  });
}
function findOrCreateShorturl(url, res) {
  let shorturl = Math.floor(Math.random() * 10000);

  Shorturl.findOne({ original_url: url }).
    then((data) => {
      if (!data) {
        //introducir url
        createShorturl(url, shorturl);
      } else shorturl = data.short_url;
      res.json({ original_url: url, short_url: shorturl })
    }).catch((err) => {
      console.log(err);
    })
}
app.post('/api/shorturl', function(req, res, next) {
  let url = req.body.url;

  if (isValidUrl(url)) findOrCreateShorturl(url, res);
  else res.json({ error: 'invalid url' });

})

app.get('/api/shorturl/:shorturl', function(req, res) {
  Shorturl.findOne({ short_url: req.params.shorturl }).
    then(urlData => {
      if (urlData) res.redirect(urlData.original_url);
      else res.json({ error: 'No short URL found for the given input' });
      
    })
})
