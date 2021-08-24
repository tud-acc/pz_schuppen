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

// Nodemailer, versand der E-Mails über Gmail
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "mypizza.ibsprojekt@gmail.com",
    pass: "umgmlagvccewxgpe" // Google Generiertes App-Passwort
  }
});
// test connection
transporter.verify().then(console.log).catch(console.error);

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
app.get("/node.js", async function (req, res) {
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

  var zutatentest = await getAlleZutaten();
  console.log(zutatentest);

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

      let query_userinfos =
        "SELECT vorname, nachname FROM kunde WHERE email = ?";
      let result_userinfos = await conn.query(query_userinfos, [
        data_anmelden.email
      ]);

      console.dir("Result userinfos query: " + result_userinfos);
      console.dir("Vorname: " + result_userinfos[0].vorname);
      console.dir("Nachname: " + result_userinfos[0].nachname);

      var session = {
        email: data_anmelden.email,
        session_id: getSessionID(),
        session_id_kurz: "",
        gesamtpreis: 0,
        pizzen: []
      };

      req.session.isAuth = true;
      req.session.email = data_anmelden.email;
      req.session.vorname = result_userinfos[0].vorname;
      req.session.nachname = result_userinfos[0].nachname;

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

  //teste Mailversand
  sendTestMail(123);

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
app.post("/bestelluebersicht.js", function (req, res) {
  console.log("Post Bestellübersicht");
  var bestid = "";
  let body = "";
  req.on("data", function (data) {
    body += data;
  });

  req.on("end", async function () {
    let params = new URLSearchParams(body);
    bestid = params.get("bestellid");

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
      let result_kunde = await conn.query(query_kunde, [bestellsession.email]);

      let query_adress =
        "SELECT strasse, hausnr, plz, ort FROM adresse WHERE adr_id = ?";
      let result_adress = await conn.query(query_adress, [
        result_kunde[0].adr_id
      ]);

      jsnbestellung.status = 0;
      jsnbestellung.kunde = result_kunde[0];
      jsnbestellung.adresse = result_adress[0];
      jsnbestellung.preis = bestellsession.gesamtpreis;
      jsnbestellung.pizzen = bestellsession.pizzen;
    }

    console.log("result: " + JSON.stringify(jsnbestellung));
    res.render("bestelluebersicht", jsnbestellung);
  });
});

//-------------------------------------------------------------------------------------//
//    Anmeldestatus
// -- GET
app.get("/anmeldestatus.js", async function (req, res) {
  console.log("GET - ANMELDESTATUS - FROM: " + req.ip);

  var ammeldestatus_json = {};

  if (req.session.isAuth) {
    ammeldestatus_json = {
      status: "angemeldet",
      email: req.session.email,
      vorname: req.session.vorname,
      nachname: req.session.nachname
    };
  } else {
    ammeldestatus_json = {
      status: "nicht angemeldet",
      email: "",
      vorname: "",
      nachname: ""
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

//---------------------------------------------------
// ALEXA SKILL
// -- GET -- sollte nie von alexa erreicht werden, da immer POST
app.get("/alexa.js", async function (req, res) {
  console.log("POST - ALEXA GET - FROM: " + req.ip);
  var data = {
    response: {
      outputSpeech: {
        text: "Hallole, das ist ein HTTP GET, welches nicht passieren sollte",
        type: "PlainText"
      },
      shouldEndSession: true
    },
    version: "1.0"
  };
  res.write(JSON.stringify(data));
  res.end();
});

// -- POST
app.post("/alexa.js", function (req, res) {
  console.log("POST - ALEXA POST - FROM: " + req.ip);

  let alexa = "";
  req.on("data", function (data) {
    alexa += data;
  });

  req.on("end", async function () {
    // Handle Alexa request
    console.log(alexa);
    alexa = JSON.parse(alexa);
    console.log(alexa);
    console.log(alexa.request.type);

    // hole session von cache -> undefined wenn session noch nicht existent
    var alexasession = cache.get(alexa.session.sessionId);
    console.log("----------------------------------------------------");
    console.log("ALEXASESSION: ");
    console.log(alexasession);

    // prüfe ob Launchrequest
    if (alexa.request.type == "LaunchRequest" && alexasession === null) {
      // neue sessionvariablen anlegen (neue Alexa Session)
      let sessionvars = {
        zustand: 1,
        bestellcode: 0,
        pizzaname: "",
        zutaten: [],
        preis: 0,

        data: {
          response: {
            outputSpeech: {
              text:
                "Willkommen bei myPizza, dem IBS Pizzaservice! Sag mir deinen Bestellcode von der Website.",
              type: "PlainText"
            },
            shouldEndSession: false // edited
          },
          version: "1.0"
        }
      };
      // daten in Cache schreiben (60 min TTL)
      cache.put(alexa.session.sessionId, sessionvars, 3600000);
    } else {
      // session ist bereits bekannt -> Kein launch request

      switch (alexasession.zustand) {
        case 1: // bestellcode prüfen und schreiben
          if (
            cache.get(alexa.request.intent.slots.bestellcode.value) !== null
          ) {
            // bestellid bekannt
            console.log("Bestellid ok");
            alexasession.bestellcode =
              alexa.request.intent.slots.bestellcode.value;
            alexasession.data.response.outputSpeech.text =
              "Der Bestellcode ist gültig. Bitte gib deiner Pizza einen Namen, damit du sie in der Bestellung wiederfindest";
            alexasession.zustand++;
          } else {
            // bestellid nicht bekannt
            console.log("Bestellid nicht ok");
            alexasession.data.response.outputSpeech.text =
              "Der Bestellcode ist ungültig. Bitte nenne mir einen gültigen Bestellcode.";
          }
          break;

        case 2: // Pizzanamen hinterlegen
          alexasession.pizzaname = alexa.request.intent.slots.pizzaname.value;
          let basispizzen = await getBasispizzen();
          alexasession.data.response.outputSpeech.text =
            "Dein Pizzaname " +
            alexasession.pizzaname +
            " wurde erfolgreich aufgenommen. Bitte wähle eine Basispizza aus. Es gibt folgende Basispizzen: " +
            basispizzen.join();
          alexasession.zustand++;
          break;

        case 3: // basispizza prüfen
          var basispizza = alexa.request.intent.slots.basispizza.value;

          let bp = Array.from(await getBasispizzen());
          console.log(bp);
          if (bp.indexOf(basispizza) > -1) {
            alexasession.data.response.outputSpeech.text =
              "Du hast die Basispizza " +
              basispizza +
              " gewählt. Willst du die Pizza so bestellen oder weitere Zutaten hinzufügen?";

            let pizza = await getBasispizza(basispizza);
            for (let i = 0; i < 8; i++) {
              alexasession.zutaten.push(i + 1, pizza[i]);
            }
            alexasession.preis = pizza.preis;
            alexasession.zustand++;
          } else {
            let basispizzen = await getBasispizzen();
            alexasession.data.response.outputSpeech.text =
              "Die Basispizza konnte nicht verstanden werden. Bitte nenne erneut eine gültige Basispizza. Es gibt folgende Basispizzen: " +
              basispizzen.join();
          }

          break;
        case 4: // auswertung -> weitere zutaten oder pizza zur bestellung hinzufügen
          var drittens = alexa.request.intent.slots.drittens.value;
          console.log(drittens);
          if (drittens === "extra zutaten" || drittens === "mehr zutaten") {
            alexasession.data.response.outputSpeech.text =
              "Nenne mir deine Extra Zutaten, welche du bestellen willst.Du kannst jederzeit Zutatenliste sagen, um alle Zutaten vorlesen zu lassen. Ebenso kanns du jederzeit die Bestellung abschließen, um die Pizza hinzuzufügen oder dir deine aktuell gewählten Zutaten aufsagen lassen";
            alexasession.zustand = 7;
          } else if (
            drittens === "fertig" ||
            drittens === "bestellung okay" ||
            drittens === "bestellung ok"
          ) {
            alexasession.data.response.outputSpeech.text =
              "Du hast eine Pizza mit den folgenden Zutaten ausgewählt: " +
              getZutatenBezeichnung(alexasession.zutaten) +
              " Möchtest du Sie so zur Bestellung hinzufügen?";
            alexasession.zustand = 5;
          } else {
            alexasession.data.response.outputSpeech.text =
              "Das habe ich leider nicht verstanden. Bitte sage Bestellung Okay oder extra Zutaten.";
          }
          break;

        case 5: // -> pizza hinzufügen (mqtt) oder weiter bearbeiten
          let answer = alexa.request.intent.slots.ifuenftens.value;
          if (answer === "hinzufuegen" || answer === "hinzufügen") {
            // pizza in bestellsession hinzufügen und mqtt publishen
          } else {
            alexasession.zustand = 7;
          }

          break;

        case 6:
          let allezutaten = await getAlleZutaten();
          alexasession.data.response.outputSpeech.text = allezutaten;
          alexasession.zustand = 7;
          break;
        case 7:
          var viertens = alexa.request.intent.slots.iviertens.value;
          if (
            viertens === "Was ist auf meiner Pizza drauf" ||
            viertens === "Zutaten vorlesen" ||
            viertens === "Aktuelle Zutaten vorlesen"
          ) {
          } else if (viertens === "Bestellung abschließen") {
          } else if (viertens === "Zutatenliste") {
          } else if (viertens.includes()) {
          } else {
            alexasession.data.response.outputSpeech.text =
              "Das habe ich leider nicht verstanden. Bitte sage Zutaten vorlesen oder Bestellung abschließen oder Zutatenliste oder nenne eine Zutate, welche zusätzlich auf deine Pizza gelegt werden soll";
          }

          break;
        case 8:
          break;

        case 9:
          break;

        case 10:
          break;

        default:
          //default nötig
          break;
      } //- end switch
      // schreibe alexasession objekt zurück in cache
      cache.put(alexa.session.sessionId, alexasession, 3600000);
    } //- end else

    // schreibe output
    let out = JSON.stringify(cache.get(alexa.session.sessionId).data);
    res.write(JSON.stringify(out));
    res.end();
  });
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
    if (pizza["zutat" + i] !== undefined) {
      for (let j = 0; j < Object.keys(zutaten).length; j++) {
        if (pizza["zutat" + i] === zutaten[j].zid) {
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

// lese alle verfügbaren Basispizzen aus der Datenbank
async function getBasispizzen() {
  let result = [];
  let pizzen = await conn.query("SELECT name FROM pizza");
  for (let i = 0; i < Object.keys(pizzen).length; i++) {
    result.push(pizzen[i].name.toLowerCase());
  }
  return result;
}

// Hole basispizza (preis und zutaten aus der Datenbank)
async function getBasispizza(pizzaname) {
  let pizzaquerry =
    "SELECT zutat1, zutat2, zutat3, zutat4, zutat5, zutat6, zutat7, zutat8, preis FROM pizza WHERE name = ?";
  let pizza = await conn.query(pizzaquerry, [pizzaname]);
  return pizza[0];
}

// hole zutatennamen aus der Datenbank
async function getZutatenBezeichnung(pizzazutaten) {
  let zutaten = "Tomaten, Käse";
  for (let i = 0; i < pizzazutaten.length; i++) {
    if (pizzazutaten[i] !== null) {
      let zutatenquerry = "SELECT bezeichnung FROM zutaten WHERE zid = ?";
      let zutatenresult = await conn.query(zutatenquerry, [pizzazutaten[i]]);
      console.log(zutatenresult);
      zutaten += ", " + zutatenresult[0].bezeichnung;
    }
  }

  console.log(zutaten);
  return zutaten;
}

async function getAlleZutaten() {
  var allezutaten = "";
  var allezutatenquery = "SELECT bezeichnung FROM zutaten";
  var allezutatenreqult = await conn.query(allezutatenquery);

  //console.log(allezutatenreqult);
  //console.log(allezutatenreqult.length);

  for (let i = 0; i < allezutatenreqult.length; i++) {
    allezutaten += allezutatenreqult[i].bezeichnung + ", ";
  }
  return allezutaten;
}

//-------------- EMail versenden
// DEBUG TESTE MAIL_VERSAND:
function sendTestMail(bestell_id) {
  let envelope = {
    from: '"mypizza" <mypizza.ibsprojekt@gmail.com>', // absender Adresse
    to: "mypizza.ibsprojekt@gmail.com", // empfänger -> email des angemeldeten Users
    subject: "MyPizza - Deine Bestellung", // Betreffzeile
    text: "Test vom IBS-node Server :)" // plain text body
    //html: "<b>Test vom IBS-node Server :)</b>" // html body
  };

  let bestellung = cache.get(bestell_id);
  let mailtext = "Deine Bestellung \n\n";

  //liste alle Pizzen auf:
  for (let i = 0; i < Object.keys(bestellung.pizzen).length; i++) {
    mailtext +=
      bestellung.pizzen[i].name + "   |" + bestellung.pizzen[i].preis + " €\n";
  }

  mailtext += "---------------------------\n";
  mailtext += "Gesammtpreis: " + bestellung.gesamtpreis + " €";

  // baue email
  //envelope.to = bestellung.email;
  envelope.text = mailtext;

  // Sende Email
  transporter
    .sendMail(envelope)
    .then((info) => {
      console.log({ info });
    })
    .catch(console.error);
}
