var server = require("node-fastcgi");
//var server = require('http');
var express = require("express");
var app = express();
app.set("view engine", "pug");
app.set("views", "./pug-views");

// Datenbank Setup
var mysql = require("promise-mysql");
var config = {
    user: "admin",
    password: "ibs2021Projekt",
    database: "ibs_projekt"
  },
  conn;
mysql.createConnection(config).then((f) => {
  conn = f;
});

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
  req.on("end", async function () {
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

    //(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])
    //https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression

    // var query = connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, results)
    var query_email = "SELECT * FROM kunde WHERE email = ?";

    var result_email = await conn.query(query_email, [data.email]);

    var result_data = {
      result_email: JSON.parse(JSON.stringify(result_email))
    };
    console.log("Query Result: " + result_data);

    var query_insert =
      "INSERT INTO kunde (email, vorname, nachname, passwort) VALUES(?,?,?,?)";

    var result = await conn.query(query_insert, [
      data.email,
      data.vorname,
      data.nachname,
      data.passwort
    ]);

    if (Object.keys(result_email).length === 0) {
      //schreibe hier zeugs in die db
    } else {
      console.dir("Error: Email schon in der DB vorhanden");
    }

    console.log("POST", data);
    res.writeHead(307, { Location: "/node.js" });

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
