var server = require("node-fastcgi");
//var server = require('http');
var express = require("express");
var cache = require("memory-cache");
var session = require("express-session");
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

app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: false
  })
);

//-------------------------------------------------------------------------------------//
//   MAINPAGE (INDEX)
// -- GET
app.get("/node.js", function (req, res) {
  console.log("GET - MAINPAGE - FROM: " + req.ip);
  console.log(req.session);
  console.log(req.session.id);

  if (req.session.test1) {
    req.session.test1++;
    console.dir(req.session.test1);
  } else {
    req.session.test1 = 1;
    console.log(req.session.test1);
  }

  //var ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  //console.log(ip);
  var data = { test_id: "123456" };

  res.render("index", data);
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
  console.log("POST - ANMELDEN - FROM:" + req.ip);
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
        gesamtpreis: 0,
        pizzen: []
      };

      req.session.isAuth = true;

      console.dir(session);
      cache.put(123, session, 3600000);
      // cache.put(jsnMessage.session.sessionId, sessionvars, 3600000);
      // let session = cache.get(jsnMessage.session.sessionId);

      // Weiterleitung nach erfolgreicher Anmeldung:
      res.redirect("/node.js");
      /*
      res.writeHead(307, { Location: "/node.js" });
      res.end();
      */
    } else {
      console.dir("Irgendwas ist schief gegangen beim ANMELDEN!");
      res.redirect("/anmelden.js");
    }

    //res.writeHead(307, { Location: "/node.js" });
    //res.end();
  });
});

function getSessionID() {
  var id = Math.floor(Math.random() * 100000000) + 100000000;

  return id;
}

var isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    console.log("Bitte erst anmelden!");
    res.redirect("/node.js");
  }
};

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
      res.redirect("/node.js");
      console.log("Nach dem redirect vom insert");

      //res.writeHead(307, { Location: "/node.js" });
      res.end();

      //console.dir("DEBUG: Email noch nicht vorhanden.");
    } else {
      console.dir("Error: Email schon in der DB vorhanden");

      console.log("POST - REGISTRIEREN - FROM: " + req.ip + " ERROR DB");
      console.log(data);
      res.redirect("/registrieren.js");
    }
  });
});

//-------------------------------------------------------------------------------------//
//    Bestellen
// -- GET
app.get("/bestellen.js", isAuth, function (req, res) {
  console.log("GET - BESTELLEN - FROM: " + req.ip);
  res.render("bestellung");
});

// -- POST
app.post("/bestellen.js", isAuth, function (req, res) {
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

//-------------------------------------------------------------------------------------//
//    Abmelden / Logout
// -- GET
app.get("/abmelden.js", async function (req, res) {
  console.log("GET - LOGOUT - FROM: " + req.ip);
  req.session.destroy((err) => {
    if (err) {
      throw err;
      res.redirect("/node.js");
    } else {
      res.redirect("/node.js");
    }
  });
});

//comment

// -- POST
app.post("/abmelden.js", function (req, res) {
  console.log("POST - LOGOUT - FROM: " + req.ip);
  req.session.destroy((err) => {
    if (err) {
      throw err;
      res.redirect("/node.js");
    } else {
      res.redirect("/node.js");
    }
  });
});

//---------------------------------------------------
// BESTELLÜBERSICHT
// -- GET
app.get("/bestelluebersicht.js", async function (req, res) {
  // sollte nicht möglich sein, redirect auf startseite:
  res.redirect("/node.js");
});

// -- POST
app.post("/bestelluebersicht.js", async function (req, res) {
  console.log("Post Bestellübersicht");
  let bestid;
  var body = "";
  req.on("data", function (data) {
    body += data;
  });
  req.on("end", async function () {
    let params = new URLSearchParams(body);
    bestid = params.bestell_id;
    console.log(params);
  });
  console.log("body:");
  console.log(body);

  // result json object:
  let jsnbestellung = {
    id: bestid,
    status: -1,
    kunde: null,
    adresse: null,
    preis: 0, //bestellsession.preis
    pizzen: [] // bestellsession.pizzen
  };
  // hole bestellung aus cache
  let bestellsession = cache.get(bestid);
  if (bestellsession !== null && bestellsession !== undefined) {
    let query_kunde =
      "SELECT vorname, nachname, adr_id FROM kunde WHERE email = ?";
    let result_kunde = await conn.query(query_kunde, bestellsession.email);

    let query_adress =
      "SELECT strasse, hausnr, plz, ort FROM adresse WHERE adr_id = ?";
    let result_adress = await conn.query(query_adress, result_kunde.adr_id);

    jsnbestellung.status = 0;
    jsnbestellung.kunde = result_kunde;
    jsnbestellung.adresse = result_adress;
    jsnbestellung.preis = bestellsession.gesamtpreis;
    jsnbestellung.pizzen = bestellsession.pizzen;
  }

  console.log("result: " + JSON.stringify(jsnbestellung));
  res.render("bestelluebersicht", jsnbestellung);
});

//-------------------------------------------------------------------------------------//
//    Anmeldestatus
// -- GET
app.get("/anmeldestatus.js", async function (req, res) {
  console.log("GET - ANMELDESTATUS - FROM: " + req.ip);

  var ammeldestatus_json = {};

  if (req.session.isAuth) {
    ammeldestatus_json = {
      status: "angemeldet"
    };
  } else {
    ammeldestatus_json = {
      status: "nicht angemeldet"
    };
  }

  res.write(JSON.stringify(ammeldestatus_json));
  res.end();
});

// -- POST - Sollte nicht moeglich sein!
app.post("/anmeldestatus.js", function (req, res) {
  console.log("POST - ANMELDESTATUS - FROM: " + req.ip);
  console.dir("Post nicht moeglich!");
});

server.createServer(app).listen(9998);

//---------------------------------------------------
// MQTT
async function onMessage(topic, message) {
  var response = { rc: 0, preis: 0 };
  let jsm = JSON.parse(message);
  console.log(jsm);

  let bestellsession = cache.get(jsm.bestellid);
  if (bestellsession == null || bestellsession === undefined) {
    response.rc = -1;
    response["message"] = "Fehler: Bestell-ID unbekannt.";
    // antworte spezifischem client:
    mqttclient.publish(topic.replace("fr", "to"), JSON.stringify(response));
    return; // abbruch
  }

  // ADD PIZZA
  if (jsm.action == "add_Pizza") {
    let preis = await calcPizzaPreis(jsm.pizza);
    let anzahl = Object.keys(bestellsession.pizzen).length;
    jsm.pizza["bestellnr"] = Number(anzahl) + 1;

    jsm.pizza["preis"] = preis;
    jsm.pizza["bestellnr"] = Number(anzahl) + 1;

    bestellsession.pizzen.push(jsm.pizza);
    bestellsession.gesamtpreis += Number(preis);

    response.preis = bestellsession.gesamtpreis;
    response.pizzen = bestellsession.pizzen;

    cache.put(jsm.bestellid, bestellsession, 3600000);

    // DELETE PIZZA
  } else if (jsm.action == "del_Pizza") {
    let searchedIndex;
    console.log(bestellsession.pizzen);
    console.log("numKeys: " + Object.keys(bestellsession.pizzen).length);
    for (let i = 0; i < Object.keys(bestellsession.pizzen).length; i++) {
      if (
        bestellsession.pizzen[i] !== null &&
        Number(jsm.pizzaid) === Number(bestellsession.pizzen[i].bestellnr)
      ) {
        searchedIndex = i;
        break;
      }
    }
    console.log("SearchedIndex: " + searchedIndex);
    let gespreisneu =
      Number(bestellsession.gesamtpreis) -
      Number(bestellsession.pizzen[searchedIndex].preis);
    bestellsession.pizzen = removeNull(bestellsession.pizzen); // bereinige null values

    delete bestellsession.pizzen[searchedIndex]; // verursacht null values im json objekt
    bestellsession.pizzen = removeNull(bestellsession.pizzen); // bereinige null values

    console.log("gespreis: " + gespreisneu);
    bestellsession.gesamtpreis = gespreisneu;
    response.pizzen = bestellsession.pizzen;
    response.preis = gespreisneu;

    // GET BESTELLUNG
  } else if (jsm.action == "get_bestellung") {
    response.pizzen = bestellsession.pizzen;
    response.preis = bestellsession.gesamtpreis;

    // antworte spezifischem client:
    mqttclient.publish(topic.replace("fr", "to"), JSON.stringify(response));
    return; // abbruch
  }

  // sende response an alle subscriber der bestellung mit bestellid
  mqttclient.publish("pizza/orders/" + jsm.bestellid, JSON.stringify(response));
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

// lösche null elemente eines array (bereinigen)
function removeNull(array) {
  return array.filter((x) => x !== null);
}
