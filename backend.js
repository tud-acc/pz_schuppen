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
app.post("/anmelden.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = { zahl1: params.get("zahl1"), zahl2: params.get("zahl2") };
    //console.dir(params.get('zahl1'),params.get('zahl2');
    console.log("POST", data);
    res.render("anmelden", data);
  });
});

//    Registrieren
app.get("/registrieren.js", function (req, res) {
  res.render("registrieren");
});

app.post("/registrieren.js", function (req, res) {
  var data = {
    vorname: null,
    nachname: null,
    email: null,
    strasse: null,
    hausnr: null,
    plz: null,
    ort: null,
    passwort: null,
    passwort_wdh: null
  };
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = {
      vorname: params.get("vorname"),
      nachname: params.get("nachname"),
      email: params.get("email"),
      strasse: params.get("strasse"),
      hausnr: params.get("hausnr"),
      plz: params.get("plz"),
      ort: params.get("ort"),
      passwort: params.get("passwort"),
      passwort_wdh: params.get("passwort_wdh")
    };

    //DEBUG:
    console.dir(
      params.get("vorname"),
      params.get("nachname"),
      params.get("email"),
      params.get("strasse"),
      params.get("hausnr"),
      params.get("plz"),
      params.get("ort"),
      params.get("passwort"),
      params.get("passwort_wdh")
    );
    //console.dir(params.get('zahl1'),params.get('zahl2');

    //Prepared Statements fuer DB hier danch mit den Daten aus "data"

    /*
    app.use(function (req, res, next) {
      if (req.url === "/registrieren.js") {
        req.url = "/node.js";
      }
      next();
    });

    res.send({ redirect: "/node.js" });
    */
    console.log("POST", data);
    res.writeHead(307, { Location: "/node.js" });
    /*res.writeHead(301, {
      Location: "http://" + req.headers["host"] + "/node.js"
    });*/
    res.end();
    //res.render("index", data);
  });
});

//    Bestellen
app.get("/bestellen.js", function (req, res) {
  var data = { zahl1: null, zahl2: null };
  console.log("GET", data);
  res.render("bestellung", data);
});
app.post("/bestellen.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);
    var data = { zahl1: params.get("zahl1"), zahl2: params.get("zahl2") };
    //console.dir(params.get('zahl1'),params.get('zahl2');
    console.log("POST", data);
    res.render("bestellung", data);
  });
});

server.createServer(app).listen(9998);
