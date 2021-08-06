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

  console.log("POST");
});
//-------------------------------------------------------------------------------------//
//    ANMELDEN
// -- GET
app.get("/anmelden.js", function (req, res) {
  console.log("GET");
  res.render("anmelden");
});
// -- POST TODO: PRÜFEN UND FIXEN --> PASSWORT UNDEFINED
app.post("/anmelden.js", function (req, res) {
  var data_anmelden = {
    email: null,
    passwort: null
  };

  var body = "";
  req.on("data", function (data) {
    body += data;
  });

  console.dir("data: --------------------");
  console.dir(data_anmelden);

  req.on("end", async function () {
    let params = new URLSearchParams(body);
    data_anmelden = {
      email: params.get("email"),
      passwort: params.get("passwort")
    };

    req.on("error", (err) => {
      console.error(err.stack);
    });

    console.log(data_anmelden.email);
    console.log(data_anmelden.password);
    console.log(params.get("passwort"));

    let query_login = "SELECT passwort FROM kunde WHERE email = ?";
    let result_login = await conn.query(query_login, [data_anmelden.email]);
    console.dir(result_login);

    if (
      Object.keys(result_login).length !== 0 &&
      result_login.passwort === data_anmelden.passwort
    ) {
      // Login OK
      console.dir("DEBUG: logindaten OK.");
    }

    console.log("POST");

    res.writeHead(307, { Location: "/node.js" });
    res.end();
  });
});

//-------------------------------------------------------------------------------------//
//    Registrieren
//
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
    data = {
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
    //console.log(result_data);

    if (Object.keys(result_email).length === 0) {
      //schreibe hier zeugs in die db
      var query_insert_adr =
        "INSERT INTO adresse (strasse, hausnr, plz, ort) VALUES (?,?,?,?)";

      var result_adr = await conn.query(query_insert_adr, [
        data.strasse,
        data.hausnr,
        data.plz,
        data.ort
      ]);
      console.dir(result_adr);

      var query_insert_kunde =
        "INSERT INTO kunde (email, vorname, nachname, passwort, adr_id) VALUES(?,?,?,?,?)";

      var result_kunde = await conn.query(query_insert_kunde, [
        data.email,
        data.vorname,
        data.nachname,
        data.passwort,
        result_adr.insertId
      ]);

      console.log("POST", data);

      res.writeHead(307, { Location: "/node.js" });
      res.end();

      //console.dir("DEBUG: Email noch nicht vorhanden.");
    } else {
      console.dir("Error: Email schon in der DB vorhanden");

      console.log("POST", data);
      alert("E-Mail Adresse schon vorhanden!");
    }
  });
});

//-------------------------------------------------------------------------------------//
//    Bestellen
// --
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

//-------------------------------------------------------------------------------------//
//    Zutatenliste
// --
app.get("/zutaten.js", async function (req, res) {
  console.log("GET");

  var query_sel_zutaten = "SELECT bezeichnung, preis FROM zutaten";
  var result_zutaten = await conn.query(query_sel_zutaten);
  console.log(result_zutaten);
  var result_data_zutaten = JSON.stringify(result_zutaten);
  //var result_data_zutaten_parsed = JSON.parse(result_zutaten);
  console.log(result_data_zutaten);
  console.log(result_zutaten[1].bezeichnung);

  var query_sel_basispizza = "SELECT * FROM pizza";
  var result_basispizza = await conn.query(query_sel_basispizza);
  var result_data_basispizza = JSON.parse(result_basispizza);
  console.log(result_data_basispizza);
  //var result_data_basispizza = JSON.stringify(result_basispizza);

  var result_json = {
    Zutaten: result_data_zutaten,
    Basispizza: result_data_basispizza
  };
  //var result_json = result_data_zutaten.concat(result_data_basispizza);

  res.write(result_json);
  res.end();
});
app.post("/zutaten.js", function (req, res) {
  console.dir("Post nicht moeglich!");
});

server.createServer(app).listen(9998);
