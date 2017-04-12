/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var bodyParser = require('body-parser');
var http = require('https');
require('dotenv').config();

// OpenWhisk Javascript SDK settings
var openwhisk = require('openwhisk');
var options = {apihost: process.env.OpenWhisk_HOST, api_key: process.env.OpenWhisk_AuthKey};
var ow = openwhisk(options);

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:
true }));
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

//Invoke for webUI
app.get("/invoke/:action", function(req, res) {
     ow.actions.invoke({actionName: req.params.action, blocking: true, params: req.query }).then(function(param) {
        // Return the result of the OpenWhisk call
        //res.send(JSON.stringify(param.response.result));
        var result = JSON.stringify(param.response.result);
        res.render('main', {response:result,request:req.protocol + '://' + req.get('Host') + req.url +"<br>method:"+ req.method});
    }).catch(function(err) {res.send("Error: " + JSON.stringify(err));});
});


// Lists actions, packages, outes
app.get("/list/:param",function(req,res)
{
  switch (req.params.param) {
    case "actions":
      var result = [];
      ow.actions.list().then(actions => {
      actions.forEach(action => result.push(JSON.stringify({"name":action.name, "namespace":action.namespace})+"<br>"));
      res.render('main',{response:result,request:req.protocol + '://' + req.get('Host') + req.url +"<br>method:"+ req.method});

    }).catch(err => {
        console.error('failed to list actions', err);
    });
    break;

    case "packages":
       var result = [];
       ow.packages.list().then(packages => {
       packages.forEach(package => result.push(package.name+"<br>"));
       res.render('main',{response:result,request:req.protocol + '://' + req.get('Host') + req.url +"<br>method:"+ req.method});
     }).catch(err => {
         console.error('failed to list packages', err);
     });
     break;

    case "routes":
    var result = [];
    ow.routes.list().then(function(param){
      var name = JSON.stringify(param,undefined, 2);
      var parsed = JSON.parse(name).apis;
      parsed.forEach(function(element){
        result.push(JSON.stringify({"url": element.value.gwApiUrl, "basePath": element.value.apidoc.basePath, "paths": element.value.paths},null,2)+"<br>");
    })
      res.render('main', {response:result,request:req.protocol + '://' + req.get('Host') + req.url +"<br>method:"+ req.method});
    }).catch(function(err) {res.send("Error: " + JSON.stringify(err));});
   break;

    default:
     res.render('main', {response:{
     "status": "404",
     "source": { "pointer": "Check the url you have entered" },
     "detail": "Resource not found."
   },request:req.protocol + '://' + req.get('Host') + req.url +"<br>method:"+ req.method});
    break;
  }

});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
