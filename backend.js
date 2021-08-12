var server = require("node-fastcgi");
//var server = require('http');
var express = require("express");
var cache = require("memory-cache");
var Cookies = require("js-cookie");
var app = express();
app.set("view engine", "pug");
app.set("views", "./pug-views");

// MQTT
var mqtt = require("mqtt");
var mqttclient;

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

//-------------------------------------------------------------------------------------//
//   MAINPAGE (INDEX)
// -- GET
app.get("/node.js", function (req, res) {
  console.log("GET - MAINPAGE - FROM:" + req.ip);
  //var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  //console.log(ip);

  /*
  if (Cookies.get("ip") === req.ip) {
    console.dir("Du warst schon mal hier");
    console.dir("Deine IP aus dem Cookie: " + Cookies.get("ip"));
  } else {
    console.dir("Du bist neu hier");
    Cookies.set("ip", req.ip);
  }
  */

  res.render("index");
});
// -- POST
app.post("/node.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });

  console.log("POST - MAINPAGE - FROM:" + req.ip);
});

//-------------------------------------------------------------------------------------//
//    ANMELDEN
// -- GET
app.get("/anmelden.js", function (req, res) {
  console.log("GET - ANMELDEN - FROM:" + req.ip);
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

  req.on("end", async function () {
    let params = new URLSearchParams(body);
    data_anmelden = {
      email: params.get("email"),
      passwort: params.get("passwort")
    };

    req.on("error", (err) => {
      console.error(err.stack);
    });

    console.log(data_anmelden);

    let query_login = "SELECT passwort FROM kunde WHERE email = ?";
    let result_login = await conn.query(query_login, [data_anmelden.email]);
    console.dir(result_login);

    console.dir("Erst result_login.password und dann data_anmelden.passwort:");
    var new_result = JSON.stringify(result_login);
    console.dir(new_result);
    var new_result2 = JSON.parse(JSON.stringify(result_login));
    console.dir(new_result2);

    console.dir("Hier sollte newresult2.passwort drunter stehen:");
    console.dir(new_result2.passwort);
    //console.dir([0].RowDataPacket.passwort);
    console.dir("Hier1?");
    console.dir(result_login[0].passwort);
    console.dir(data_anmelden.passwort);
    console.dir("Hier2?");
    //console.dir(result_login.RowDataPacket[0].passwort);

    console.dir("object keys result login length");
    console.dir(Object.keys(result_login).length);

    if (
      Object.keys(result_login).length !== 0 &&
      result_login[0].passwort === data_anmelden.passwort
    ) {
      // Login OK
      console.dir("DEBUG: logindaten OK.");

      // Hier müsste ja der Memory-Cache gefuellt werden
      var session = {
        email: data_anmelden.email,
        session_id: getSessionID(),
        session_id_kurz: "",
        gesamtpreis: "",
        pizzen: []
      };

      console.dir(session);
      cache.put(123, session, 3600000);
      // cache.put(jsnMessage.session.sessionId, sessionvars, 3600000);
      // let session = cache.get(jsnMessage.session.sessionId);

      // Weiterleitung nach erfolgreicher Anmeldung:
      res.writeHead(307, { Location: "/node.js" });
      res.end();
    } else {
      console.dir("Irgendwas ist schief gegangen beim ANMELDEN!");
    }

    console.log("POST - ANMELDEN - FROM:" + req.ip);

    //res.writeHead(307, { Location: "/node.js" });
    //res.end();
  });
});

function getSessionID() {
  var id = Math.floor(Math.random() * 100000000) + 100000000;

  return id;
}

//-------------------------------------------------------------------------------------//
//    Registrieren
// -- GET
app.get("/registrieren.js", function (req, res) {
  console.log("GET - REGISTRIEREN - FROM: " + req.ip);
  res.render("registrieren");
});

// -- POST
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

      console.log(
        "POST - REGISTRIEREN - FROM: " + req.ip + " INSERT ERFOLGREICH"
      );
      console.log(data);

      res.writeHead(307, { Location: "/node.js" });
      res.end();

      //console.dir("DEBUG: Email noch nicht vorhanden.");
    } else {
      console.dir("Error: Email schon in der DB vorhanden");

      console.log("POST - REGISTRIEREN - FROM: " + req.ip + " ERROR DB");
      console.log(data);
      alert("E-Mail Adresse schon vorhanden!");
    }
  });
});

//-------------------------------------------------------------------------------------//
//    Bestellen
// -- GET
app.get("/bestellen.js", function (req, res) {
  console.log("GET - BESTELLEN - FROM: " + req.ip);
  res.render("bestellung");
});

// -- POST
app.post("/bestellen.js", function (req, res) {
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", function () {
    var params = new URLSearchParams(body);

    console.log("POST - BESTELLEN - FROM: " + req.ip);
    res.render("bestellung");
  });
});

//-------------------------------------------------------------------------------------//
//    Zutatenliste
// -- GET
app.get("/zutaten.js", async function (req, res) {
  console.log("GET - ZUTATENLISTE - FROM: " + req.ip);

  var query_sel_zutaten = "SELECT bezeichnung, preis FROM zutaten";
  var result_zutaten = await conn.query(query_sel_zutaten);
  //console.log(result_zutaten);
  var result_data_zutaten = JSON.stringify(result_zutaten);
  //var result_data_zutaten_parsed = JSON.parse(result_zutaten);
  /*
  console.log(result_data_zutaten);
  console.log(result_zutaten[1].bezeichnung);
  console.log(result_zutaten[1].preis);
  */

  var query_sel_basispizza = "SELECT * FROM pizza";
  var result_basispizza = await conn.query(query_sel_basispizza);
  //var result_data_basispizza = JSON.parse(result_basispizza);
  //console.log(result_data_basispizza);
  //var result_data_basispizza = JSON.stringify(result_basispizza);

  var result_json = {
    Zutaten: result_zutaten,
    Basispizza: result_basispizza
  };

  console.dir(result_json.Zutaten[1].bezeichnung);
  //var result_json = result_data_zutaten.concat(result_data_basispizza);

  //var result = result_zutaten.concat(result_basispizza);

  res.write(JSON.stringify(result_json));
  res.end();
});

// -- POST - Sollte nicht moeglich sein!
app.post("/zutaten.js", function (req, res) {
  console.log("POST - ZUTATENLISTE - FROM: " + req.ip);
  console.dir("Post nicht moeglich!");
});

server.createServer(app).listen(9998);

//---------------------------------------------------
// MQTT
async function onMessage(topic, message) {
  var response = { rc: 0, preis: 0 };
  let jsm = JSON.parse(message);
  console.log(jsm);

  if (jsm.action == "add_Pizza") {
    let bestellsession = cache.get(jsm.bestellid);
    let preis = await calcPizzaPreis(jsm.pizza);
    let anzahl = Object.keys(bestellsession.pizzen).length;

    jsm.pizza["preis"] = preis;
    jsm.pizza["bestellnr"] = Number(anzahl) + 1;

    bestellsession.pizzen.push(jsm.pizza);
    bestellsession.gesamtpreis += Number(preis);

    response.preis = preis;
    response.pizzen = bestellsession.pizzen;

    cache.put(jsm.bestellid, bestellsession, 3600000);
  } else if (jsm.action == "get_bestellung") {
    response.pizzen = [];
    // for-loop pizzen einfügen
    response.pizzen.push({ name: "pizza1", preis: "6,50€" });

    // antworte spezifischem client:
    mqttclient.publish(topic.replace("fr", "to"), JSON.stringify(response));
    return; // abbruch
  }

  // sende response an alle subs
  mqttclient.publish("pizza", JSON.stringify(response));
  //mqttclient.publish(topic.replace("fr", "to"), JSON.stringify(response));
}

// autostart mqtt listener
(async function main() {
  console.log("starte mqtt listener");
  mqttclient = mqtt.connect("mqtt://127.0.0.1", {}).on("connect", function () {
    console.log("connected");
    mqttclient.on("message", onMessage);
    mqttclient.subscribe("mqttfetch/pizza/+/fr/+");
  });
})();

// --- END mqtt
//---------------------------------
// Helper Funktion mqtt
async function calcPizzaPreis(pizza) {
  var preis = 5.0;
  let zutaten = await conn.query("SELECT * FROM zutaten");
  for (let i = 1; i <= 8; i++) {
    if (pizza["zutat" + i] != undefined) {
      for (let j = 0; j < Object.keys(zutaten).length; j++) {
        if (pizza["zutat" + i] == zutaten[j].zid) {
          preis += Number(zutaten[j].preis);
        }
      }
    } else {
      break;
    }
  }
  return preis;
}

function isloggedin() {
  var json_object = cache.get(session_id);
  var email = json_object.email;

  if (email === "") {
    return false;
  } else {
    return true;
  }
}

function isloggedin2str() {
  if (isloggedin == "true") {
    var json_object = cache.get(session_id);
    var email = json_object.email;
    var vorname = json_object.vorname;
    var nachname = json_object.nachname;

    var ausgabe = "Angemeldet: " + email + " - " + vorname + " " + nachname;
    return ausgabe;
  } else {
    return "Nicht angemeldet";
  }
}
