// -------------------------------------------------- //
// Module Dependencies
// -------------------------------------------------- //
var express = require('express');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var http = require('http');
var request = require('request');
var path = require('path');
var config = require('./config.js');              // Get our config info (app id and app secret)
var sys = require('util');
var app = express();

// -------------------------------------------------- //
// Config Variables
// -------------------------------------------------- //
var _smClientID = config.SURVEY_MONKEY_CLIENT_ID;
var _smClientSecret = config.SURVEY_MONKEY_CLIENT_SECRET; 
var _smRedirectURL = config.SURVEY_MONKEY_REDIRECT_URL; 
var _smAPIKey = config.SURVEY_MONKEY_API_KEY; 
var _authcode; 

function load_config_variables(res){
	res.cookie('clientID', _smClientID, {}); 
	res.cookie('redirectURL', _smRedirectURL, {}); 
	res.cookie('apiKey', _smAPIKey, {}); 
	return res; 
}
// -------------------------------------------------- //
// Express set-up and middleware
// -------------------------------------------------- //
app.use(cookieParser()); 
app.use(function (req, res, next) {
	res.cookie('clientID', _smClientID, {}); 
	res.cookie('redirectURL', _smRedirectURL, {}); 
	res.cookie('apiKey', _smAPIKey, {}); 
    next();
});
app.set('port', config.PORT || 80);
// app.use(express.favicon());      // must install if we need
                                    // cookieParser middleware to work with cookies
// app.use(express.session({ secret: config.EXPRESS_SESSION_SECRET }));   // must install if we need
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));        // this was in the example




app.get('/redirect', function(req, res){
	if (req.query.error != null){
		console.log("error detected"); 
	}
	_authcode = req.query.code; 
	var requestObject = {
      'client_id': _smClientID,
      'redirect_uri': _smRedirectURL,
      'client_secret': _smClientSecret,
      'code': _authcode,
      'grant_type': 'authorization_code'
  	};
  	var sm_token_request_header = {
  		'Content-Type': 'application/x-www-form-urlencoded'	
  	};

  	var SM_API_BASE = "https://api.surveymonkey.net";
	var ACCESS_TOKEN_ENDPOINT = "/oauth/token";
	var access_token_uri = SM_API_BASE + ACCESS_TOKEN_ENDPOINT + '?api_key=' + _smAPIKey;
	var options = {
		method: 'POST',
		url: access_token_uri,	
		headers: sm_token_request_header, 
		form: requestObject
	};
	request(options, function(error, response, body){
		if (!error){
			body = JSON.parse(body); 
			var accessToken = body.access_token; 
			res.cookie('accessToken', accessToken, {});
			res.redirect('/smWDC.html');
		} else {
			console.log(error); 
		}
	});

});


// -------------------------------------------------- //
// Create and start our server
// -------------------------------------------------- //
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
// -------------------------------------------------- //
// Variables
// -------------------------------------------------- //
// var _mshAppID = config.MSHEALTH_CLIENT_ID;
// var _mshAppSecret = config.MSHEALTH_CLIENT_SECRET;
// var _mshRedirectURL = config.MSHEALTH_REDIRECT_URL;
// var _mshAuthCode;                                                 // this will hold our code once we authorize user


// // -------------------------------------------------- //
// // Routes
// // -------------------------------------------------- //

// // this is the route to which MSH API calls back
// app.get('/redirect', function(req, res) {

//   // get our authorization code
//   _mshAuthCode = req.query.code;
  
//   // console.log("MSH API Authorization Code:  " + _mshAuthCode);
//   console.log("Redirecting...");

//   // set-up an object to use for our POST to MSH API for the authorization token
//   var requestObject = {
//       'client_id': _mshAppID,
//       'redirect_uri': _mshRedirectURL,
//       'client_secret': _mshAppSecret,
//       'code': _mshAuthCode,
//       'grant_type': 'authorization_code'
//   };

//   var msh_token_request_header = {
//     'Content-Type': 'application/x-www-form-urlencoded'  
//   };
  
//   // var oauth_request_headers = {
//   //   'Authorization': 'Client ' + _mshAppSecret,
//   //   'Accept': 'application/json',
//   //   'Content-Type': 'application/json'
//   // };


//   var options = {
//     method: 'POST',
//     url: 'https://login.live.com/oauth20_token.srf',
//     headers: msh_token_request_header,
//     form: requestObject
//   };

//   request(options, function (error, response, body) {
//     if (!error) {
//       // console.log('Our body is: ' + body);
      
//       body = JSON.parse(body);
      
//       var accessToken = body.access_token;
//       // console.log('accessToken: ' + accessToken);
      
//       res.cookie('accessToken', accessToken, { });
//       res.redirect('/mshWDC.html');
//     } else {
//       console.log(error);
//     }
//   });
// });



