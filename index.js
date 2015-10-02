// IMPORTED MODULES

var express = require('express');
var Uber = require('node-uber')
var cookieParser = require('cookie-parser');
var session = require('express-session')
var async = require('async')

// APP INITIALIZATION 

var app = express();
app.engine('html', require('ejs').renderFile);

app.use(cookieParser());
app.use(session({
  secret: 'hjsilgioemgha',
  saveUninitialized: true,
  resave: false
}))

app.use(express.static('static'));

// UBER OAUTH
// Authentication
var redirectUri = 'http://localhost:3000/oauth/callback';

if (process.env === 'production'){
  redirectUri = 'https://tookmethere.herokuapp.com/oauth/callback'
}

var uber = new Uber({
  client_id: 'l7HWUwY_GpFbmH72sLV7qc4ko8S7zmat',
  client_secret: '4PCmNZM7WY_CNnr4WOYPosBTz9EEgKyZYUXdSl2s',
  server_token: 'XkmGsCceVLJAyN6oY0hKh3jFvpLCbRxBBMDn36dS',
  redirect_uri: redirectUri,
  name: 'took-me-there'
});


// PAGE ROUTES

app.get('/', function (req, res) {
  res.render('home.html');
});

app.get('/home', function (req, res) {
  res.render('home.html');
});

app.get('/products', function (req, res) {
  res.render('products.html');
});

app.get('/about', function (req, res) {
  res.render('about.html');
});

app.get('/my-trips', function (req, res) {
  res.render('my-trips.html');
});

app.get('/test', function (req, res) {
  res.render('test_page.html');
});

app.get('/sign-in', function (req, res) {

  var url = uber.getAuthorizeUrl(['history']);
  res.redirect(url);
  console.log(url);
});

app.get('/redirect', function(req, res) {
    var url = share(req.query.service, req.query);
    res.redirect(url);
});

// UBER OAUTH ROUTES

app.get('/oauth/callback', function (req, res) {

  var code = req.query.code

  uber.authorization({ authorization_code: code }, 
    function (err, access_token) {
      req.session.uberToken = access_token
      res.redirect('/my-trips');
    });
});

app.get('/api/products', function (req, res) {
  uber.products.list({ latitude: 3.1357, longitude: 101.6880 }, function (err, apiResponse) {
    res.send(apiResponse);
  });
});

app.get('/api/profile', function (req, res) {
  uber.user.profile({access_token: req.session.uberToken}, function (err, apiResponse) {
    res.send(apiResponse);
  });
});

// Handle more than 50 trips by accessing different pages and adding them to an array

app.get('/api/me', function (req, res) {
  uber.user.activity({access_token: req.session.uberToken, offset: 0}, function (err, firstPage) {

    if (err) {      
      console.log(err);
      res.send(err);
      return;
    }

    var numPages = (firstPage.count) / 50;
    var requestsNeeded = [];

    function requestPage (page, callback) {
      console.log(page);
      uber.user.activity({access_token: req.session.uberToken, offset: (page * 50)}, callback);
    }

    for (i = 1; i < numPages; i++) { 
      requestsNeeded.push(
        requestPage.bind(null, i)
        );
    }

// Concatenate all the pages that we got responses from in our requestsNeeded array

    async.parallel(requestsNeeded, 
      function onComplete(err, responses) {
        var allTrips = firstPage.history;
        responses.forEach(function addPage(page) {

          console.log(page.history.length);
          allTrips = allTrips.concat(page.history);
        });
        res.send(allTrips);
        console.log(allTrips.length)
      });
  });
});

// SERVER

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});