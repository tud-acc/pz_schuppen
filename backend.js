var server = require("node-fastcgi");
//var server = require('http');
var express = require("express");
var app = express();
app.set("view engine", "pug");
app.set("views", "./pug-views");

//   MAINPAGE (INDEX)
app.get("/node.js", function (req, res) {
  var data = { zahl1: null, zahl2: null };
  console.log("GET", data);
  res.render("index", data);
});
app.post("/node.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = { zahl1: params.get("zahl1"), zahl2: params.get("zahl2") };
    //console.dir(params.get('zahl1'),params.get('zahl2');
    console.log("POST", data);
    res.render("index", data);
  });
});

//    ANMELDEN
app.get("/anmelden.js", function (req, res) {
  var data = { zahl1: null, zahl2: null };
  console.log("GET", data);
  res.render("anmelden", data);
});
app.post("anmelden.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = { zahl1: params.get("zahl1"), zahl2: params.get("zahl2") };
    //console.dir(params.get('zahl1'),params.get('zahl2');
    console.log("POST", data);
    res.render("index", data);
  });
});

//    Registrieren
app.get("/registrieren.js", function (req, res) {
  var data = { zahl1: null, zahl2: null };
  console.log("GET", data);
  res.render("anmelden", data);
});
app.post("registrieren.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = { zahl1: params.get("zahl1"), zahl2: params.get("zahl2") };
    //console.dir(params.get('zahl1'),params.get('zahl2');
    console.log("POST", data);
    res.render("index", data);
  });
});

//    Bestellen
app.get("/bestellen.js", function (req, res) {
  var data = { zahl1: null, zahl2: null };
  console.log("GET", data);
  res.render("anmelden", data);
});
app.post("bestellen.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = { zahl1: params.get("zahl1"), zahl2: params.get("zahl2") };
    //console.dir(params.get('zahl1'),params.get('zahl2');
    console.log("POST", data);
    res.render("index", data);
  });
});

server.createServer(app).listen(9998);
