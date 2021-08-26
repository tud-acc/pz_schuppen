//Includes
var server = require("node-fastcgi");
var express = require("express");
var cache = require("memory-cache");
var session = require("express-session");
var dateformat = require("dateformat");
var now = new Date();

// express
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
app.get("/node.js", function (req, res) {
  console.log("GET - MAINPAGE - FROM: " + req.ip);
  res.render("index");
});
// -- POST
app.post("/node.js", function (req, res) {
  console.log("POST - MAINPAGE - FROM:" + req.ip);
  res.render("index");
});

//-------------------------------------------------------------------------------------//
//    ANMELDEN
// -- GET
app.get("/anmelden.js", function (req, res) {
  console.log("GET - ANMELDEN - FROM:" + req.ip);
  res.render("anmelden");
});
// -- POST
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

    console.log("Angemeldet: ");
    console.log(data_anmelden);

    let query_login = "SELECT passwort FROM kunde WHERE email = ?";
    let result_login = await conn.query(query_login, [data_anmelden.email]);

    if (
      Object.keys(result_login).length !== 0 &&
      result_login[0].passwort === data_anmelden.passwort
    ) {
      console.dir("Login OK");

      let query_userinfos =
        "SELECT vorname, nachname FROM kunde WHERE email = ?";
      let result_userinfos = await conn.query(query_userinfos, [
        data_anmelden.email
      ]);

      var session = {
        email: data_anmelden.email,
        session_id: req.session.id,
        gesamtpreis: 0,
        pizzen: []
      };

      req.session.isAuth = true;
      req.session.email = data_anmelden.email;
      req.session.vorname = result_userinfos[0].vorname;
      req.session.nachname = result_userinfos[0].nachname;
      req.session.bestellid = makeid(6);

      //schreibe session in den Cache
      cache.put(req.session.bestellid, session, 3600000);

      // Weiterleitung nach erfolgreicher Anmeldung:
      res.redirect("/node.js");
    } else {
      // Weiterleitung nach fehlgeschlagener Anmeldung:
      console.dir("Login fehlgeschlagen");
      res.redirect("/anmelden.js");
    }
  });
});

//-------------------------------------------------------------------------------------//
//    Registrieren
// -- GET
app.get("/registrieren.js", function (req, res) {
  console.log("GET - REGISTRIEREN - FROM: " + req.ip);
  res.render("registrieren");
});

// -- POST
app.post("/registrieren.js", function (req, res) {
  var data_registrieren = {
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
    data_registrieren = {
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
      "Neu registriert: " + params.get("vorname"),
      params.get("nachname"),
      params.get("email"),
      params.get("strasse"),
      params.get("hausnr"),
      params.get("plz"),
      params.get("ort"),
      params.get("passwort"),
      params.get("passwort_wdh")
    );

    var query_select_email = "SELECT * FROM kunde WHERE email = ?";
    var result_select_email = await conn.query(query_select_email, [
      data_registrieren.email
    ]);

    if (Object.keys(result_select_email).length === 0) {
      // Schreibe in die Datenbank
      var query_insert_adr =
        "INSERT INTO adresse (strasse, hausnr, plz, ort) VALUES (?,?,?,?)";

      var result_insert_adr = await conn.query(query_insert_adr, [
        data_registrieren.strasse,
        data_registrieren.hausnr,
        data_registrieren.plz,
        data_registrieren.ort
      ]);

      var query_insert_kunde =
        "INSERT INTO kunde (email, vorname, nachname, passwort, adr_id) VALUES(?,?,?,?,?)";

      var result_insert_kunde = await conn.query(query_insert_kunde, [
        data_registrieren.email,
        data_registrieren.vorname,
        data_registrieren.nachname,
        data_registrieren.passwort,
        result_insert_adr.insertId
      ]);

      console.log(
        "POST - REGISTRIEREN - FROM: " + req.ip + " INSERT ERFOLGREICH"
      );

      res.redirect("/node.js");
      res.end();
    } else {
      console.dir("Error: Email schon in der DB vorhanden");
      console.log("POST - REGISTRIEREN - FROM: " + req.ip + " ERROR DB");
      res.redirect("/registrieren.js");
    }
  });
});

//-------------------------------------------------------------------------------------//
//    Bestellen
// -- GET
app.get("/bestellen.js", function (req, res) {
  console.log("GET - BESTELLEN - FROM: " + req.ip);

  // wenn keine id angefragt wird, setzte bestellid von angemeldetem user
  if (req.query.id === null || req.query.id === undefined) {
    if (req.session.isAuth) {
      res.redirect("/bestellen.js?id=" + req.session.bestellid);
      return;
    }
  }
  res.render("bestellung");
});

// -- POST
app.post("/bestellen.js", function (req, res) {
  console.log("POST - BESTELLEN - FROM: " + req.ip);

  // wenn keine id angefragt wird, setzte bestellid von angemeldetem user
  if (req.query.id === null || req.query.id === undefined) {
    if (req.session.isAuth) {
      res.redirect("/bestellen.js?id=" + req.session.bestellid);
      return;
    }
  }
  res.render("bestellung");
});

//-------------------------------------------------------------------------------------//
//   Impressum
// -- GET
app.get("/impressum.js", async function (req, res) {
  console.log("GET - IMPRESSUM - FROM: " + req.ip);
  res.render("impressum");
});
// -- POST
app.post("/impressum.js", function (req, res) {
  console.log("POST - IMPRESSUM - FROM:" + req.ip);
  res.render("impressum");
});

//-------------------------------------------------------------------------------------//
//    Zutatenliste
// -- GET
app.get("/zutaten.js", async function (req, res) {
  console.log("GET - ZUTATENLISTE - FROM: " + req.ip);

  var query_sel_zutaten = "SELECT bezeichnung, preis FROM zutaten";
  var result_zutaten = await conn.query(query_sel_zutaten);

  var query_sel_basispizza = "SELECT * FROM pizza";
  var result_basispizza = await conn.query(query_sel_basispizza);

  var result_json = {
    Zutaten: result_zutaten,
    Basispizza: result_basispizza
  };

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
    } else {
      res.redirect("/node.js");
    }
  });
});

// -- POST
app.post("/abmelden.js", async function (req, res) {
  console.log("POST - LOGOUT - FROM: " + req.ip);
  req.session.destroy((err) => {
    if (err) {
      throw err;
    } else {
      res.redirect("/node.js");
    }
  });
});

//---------------------------------------------------
// BESTELLÜBERSICHT
// -- GET
app.get("/bestelluebersicht.js", async function (req, res) {
  // Sollte nicht möglich sein, redirect auf Startseite:
  res.redirect("/node.js");
});

// -- POST
app.post("/bestelluebersicht.js", function (req, res) {
  console.log("POST Bestellübersicht");
  let bestid = "";
  let sendmail;
  let body = "";
  req.on("data", function (data) {
    body += data;
  });

  req.on("end", async function () {
    let params = new URLSearchParams(body);
    bestid = params.get("bestellid");
    try {
      sendmail = params.get("sendmail");
    } catch {
      // sendmail wurde nicht übergeben -> nur Daten anzeigen
    }

    let session = cache.get(bestid);
    // prüfe ob bestellung abgeschlossen werden soll -> sendmail true
    // sende bestellemail und schreibe bestellung in DB
    if (sendmail === "true") {
      if (session.session_id === req.session.id) {
        sendMail(bestid);
        bestellungEintragen(bestid);
        res.redirect("/node.js");
        return;
      } else {
        res.redirect("/bestellen.js?id=" + bestid);
      }
    }

    // result json object zur interpolation in pug:
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

    console.log("Bestellübersicht JSON Daten für pug:");
    console.log(JSON.stringify(jsnbestellung));
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
    alexa = JSON.parse(alexa);

    // hole session von cache -> undefined wenn session noch nicht existent
    var alexasession = cache.get(alexa.session.sessionId);

    // prüfe ob Launchrequest
    // ---- Launchrequest
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
            shouldEndSession: false
          },
          version: "1.0"
        }
      };
      // daten in Cache schreiben (60 min TTL)
      cache.put(alexa.session.sessionId, sessionvars, 3600000);
    } else {
      // ---- Intent Request --> Session ist bereits bekannt

      switch (alexasession.zustand) {
        case 1: // bestellcode prüfen und schreiben
          if (
            cache.get(alexa.request.intent.slots.bestellcode.value) !== null
          ) {
            // bestellid bekannt
            console.log("Alexa: Bestellid ok");
            alexasession.bestellcode =
              alexa.request.intent.slots.bestellcode.value;
            alexasession.data.response.outputSpeech.text =
              "Der Bestellcode ist gültig. Bitte gib deiner Pizza einen Namen, damit du sie in der Bestellung wiederfindest";
            alexasession.zustand = 2;
          } else {
            // bestellid nicht bekannt
            console.log("Alexa: Bestellid nicht ok");
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
          alexasession.zustand = 3;
          break;

        case 3: // basispizza prüfen
          var basispizza = alexa.request.intent.slots.auswahl.value;

          let bp = Array.from(await getBasispizzen());
          if (bp.indexOf(basispizza) > -1) {
            alexasession.data.response.outputSpeech.text =
              "Du hast die Basispizza " +
              basispizza +
              " gewählt. Sage mir, ob du die Pizza so bestellen oder weitere Zutaten hinzufügen willst";

            let pizza = await getBasispizza(basispizza);
            alexasession.zutaten = [];
            for (let i = 1; i <= 8; i++) {
              if (pizza["zutat" + i] !== null) {
                alexasession.zutaten.push(pizza["zutat" + i]);
              }
            }
            alexasession.preis = pizza.preis;
            alexasession.zustand = 4;
          } else {
            let basispizzen = await getBasispizzen();
            alexasession.data.response.outputSpeech.text =
              "Die Basispizza konnte nicht verstanden werden. Bitte nenne erneut eine gültige Basispizza. Es gibt folgende Basispizzen: " +
              basispizzen.join();
          }

          break;
        case 4: // auswertung -> weitere zutaten oder pizza zur bestellung hinzufügen
          var viertens = alexa.request.intent.slots.auswahl.value;
          if (
            viertens === "extra zutaten" ||
            viertens === "mehr zutaten" ||
            viertens === "zutaten"
          ) {
            alexasession.data.response.outputSpeech.text =
              "Nenne mir deine Extra Zutaten, welche du bestellen willst. Du kannst jederzeit Zutatenliste vorlesen sagen, um alle Zutaten vorlesen zu lassen. Ebenso kanns du jederzeit die Bestellung abschließen, um die Pizza hinzuzufügen oder dir deine aktuell gewählten Zutaten aufsagen lassen";
            alexasession.zustand = 7;
          } else if (
            viertens === "bestellung" ||
            viertens === "bestellen" ||
            viertens === "hinzufügen"
          ) {
            alexasession.data.response.outputSpeech.text =
              "Du hast eine Pizza mit den folgenden Zutaten ausgewählt: " +
              (await getZutatenBezeichnung(alexasession.zutaten)) +
              " Möchtest du Sie so zur Bestellung hinzufügen?";
            alexasession.zustand = 5;
          } else {
            alexasession.data.response.outputSpeech.text =
              "Das habe ich leider nicht verstanden. Bitte sage Bestellung Okay oder ich möchte extra Zutaten.";
          }
          break;

        case 5: // -> pizza hinzufügen (mqtt) oder weiter bearbeiten
          let auswahl = alexa.request.intent.slots.auswahl.value;
          if (
            auswahl === "hinzufuegen" ||
            auswahl === "hinzufügen" ||
            auswahl === "passt" ||
            auswahl === "bestellen"
          ) {
            // pizza in bestellsession hinzufügen und mqtt publishen
            alexaPizzaHinzufügen(
              alexasession.bestellcode,
              alexasession.pizzaname,
              alexasession.zutaten
            );

            alexasession.zustand = 9;
            alexasession.data.response.outputSpeech.text =
              "Die Pizza wurde zur Bestellung hinzugefügt. Möchtest du eine weitere Pizza zusammenstellen oder Beenden?";
          } else if (
            auswahl === "ändern" ||
            auswahl === "anpassen" ||
            auswahl === "anders belegen" ||
            auswahl === "ändere"
          ) {
            alexasession.zustand = 7;
            alexasession.data.res.outputSpeech.text =
              "Nenne mir deine Extra Zutaten, welche du bestellen willst.Du kannst jederzeit Zutatenliste sagen, um alle Zutaten vorlesen zu lassen. Ebenso kanns du jederzeit die Bestellung abschließen, um die Pizza hinzuzufügen oder dir deine aktuell gewählten Zutaten aufsagen lassen";
          } else if (auswahl === "zutaten" || auswahl === "zutat") {
            alexasession.data.res.outputSpeech.text =
              "Du hast eine Pizza mit den folgenden Zutaten ausgewählt: " +
              (await getZutatenBezeichnung(alexasession.zutaten)) +
              " Möchtest du Sie so zur Bestellung hinzufügen?";
          } else {
            alexasession.data.response.outputSpeech.text =
              "Das habe ich icht verstanden. Bitte sage Pizza ändern oder hinzufügen oder Bestellung ändern oder hinzufügen, oder die Zutaten vorlesen.";
          }
          break;
        case 7: // Auswertung weitere Zutaten / Pizza hinzufügen oder Belag vorlesen
          let auswahl2 = alexa.request.intent.slots.auswahl.value;
          var allezutaten = await getAlleZutaten(); //returns array
          if (auswahl2 === "zutaten") {
            alexasession.data.response.outputSpeech.text =
              "Auf deiner Pizza befinden sich aktuell folgende Zutaten: " +
              (await getZutatenBezeichnung(alexasession.zutaten)) +
              " Nenne weitere Zutaten für deine Pizza, lass dir die Zutatenliste vorlesen oder bestelle die Pizza mit der aktuellen belegung.";
          } else if (
            auswahl2 === "hinzufuegen" ||
            auswahl2 === "hinzufügen" ||
            auswahl2 === "passt" ||
            auswahl2 === "bestellen" ||
            auswahl2 === "bestellung" ||
            auswahl2 === "okay" ||
            auswahl2 === "pizza" ||
            auswahl2 === "abschließen"
          ) {
            alexasession.data.response.outputSpeech.text =
              "Du hast eine Pizza mit den folgenden Zutaten ausgewählt: " +
              (await getZutatenBezeichnung(alexasession.zutaten)) +
              " Möchtest du Sie so zur Bestellung hinzufügen?";
            alexasession.zustand = 5;
          } else if (auswahl2 === "zutatenliste") {
            alexasession.data.response.outputSpeech.text =
              "Folgende Zutaten sind verfügbar: " + allezutaten.join();
          } else if (allezutaten.includes(auswahl2)) {
            alexasession.zutaten.push(await getZutatId(auswahl2));
            alexasession.data.response.outputSpeech.text =
              " Ich habe " +
              auswahl2 +
              " hinzugefügt. Nenne Weitere Zutaten oder sage Pizza bestellen.";
          } else {
            alexasession.data.response.outputSpeech.text =
              "Das habe ich leider nicht verstanden. Bitte sage Zutaten vorlesen oder Bestellung abschließen oder Zutatenliste oder nenne eine Zutat, welche zusätzlich auf deine Pizza gelegt werden soll";
          }

          break;
        case 9: // Auswertung weitere Pizza bestellen oder beenden
          var neuntens = alexa.request.intent.slots.auswahl.value;
          if (
            neuntens === "bestellen" ||
            neuntens === "erstellen" ||
            neuntens === "zusammenstellen" ||
            neuntens === "hinzufügen"
          ) {
            alexasession.data.response.outputSpeech.text =
              "Bitte gib deiner Pizza einen Namen, damit du sie in der Bestellung wiederfindest";
            alexasession.zustand = 2;
          } else if (neuntens === "beenden" || neuntens === "abschließen") {
            alexasession.data.response.outputSpeech.text =
              "Vielen Dank, deine Pizza wird in der Bestellung mit der ID " +
              alexasession.bestellcode +
              "geliefert. Bis zum nächsten mal.";
            alexasession.zustand = 1;
            alexasession.data.shouldEndSession = true;
          }
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

    for (let i = 0; i < Object.keys(bestellsession.pizzen).length; i++) {
      if (
        bestellsession.pizzen[i] !== null &&
        Number(jsm.pizzaid) === Number(bestellsession.pizzen[i].bestellnr)
      ) {
        searchedIndex = i;
        break;
      }
    }

    let gespreisneu =
      Number(bestellsession.gesamtpreis) -
      Number(bestellsession.pizzen[searchedIndex].preis);
    bestellsession.pizzen = removeNull(bestellsession.pizzen); // bereinige null values

    delete bestellsession.pizzen[searchedIndex]; // verursacht null values im json objekt
    bestellsession.pizzen = removeNull(bestellsession.pizzen); // bereinige null values

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

      if (zutatenresult.length > 0) {
        zutaten += ", " + zutatenresult[0].bezeichnung;
      }
    }
  }

  return zutaten;
}

// hole zutaten-id passend zu zutatenname
async function getZutatId(bezeichnung) {
  let zutatenquery = "SELECT zid FROM zutaten WHERE bezeichnung = ?";
  let result = await conn.query(zutatenquery, [bezeichnung]);
  if (result.length < 1) {
    return -1; // zutat nicht existent
  }
  return result[0].zid; // return zutat-id
}

async function getAlleZutaten() {
  var allezutaten = [];
  var allezutatenquery = "SELECT bezeichnung FROM zutaten";
  var allezutatenreqult = await conn.query(allezutatenquery);

  for (let i = 0; i < allezutatenreqult.length; i++) {
    allezutaten.push(allezutatenreqult[i].bezeichnung.toLowerCase());
  }
  return allezutaten;
}

// Alexa-pizza zu bestellung hinzufügen und per mqtt publishen
async function alexaPizzaHinzufügen(bestellid, pname, zutaten) {
  var response = { rc: 0, preis: 0 };
  let bestellsession = cache.get(bestellid);
  let pizza = {
    name: pname,
    preis: 0
  };
  // zutaten hinzufügen
  let indx = Object.keys(zutaten).length;
  for (let i = 1; i <= indx; i++) {
    pizza["zutat" + i] = zutaten[i - 1];
  }

  let preis = await calcPizzaPreis(pizza);
  pizza.preis = preis;

  let anzahl = Object.keys(bestellsession.pizzen).length;
  pizza["bestellnr"] = Number(anzahl) + 1;

  bestellsession.pizzen.push(pizza);
  bestellsession.gesamtpreis += Number(preis);

  response.preis = bestellsession.gesamtpreis;
  response.pizzen = bestellsession.pizzen;

  cache.put(bestellid, bestellsession, 3600000);
  // sende response an alle subscriber der bestellung mit bestellid
  mqttclient.publish("pizza/orders/" + bestellid, JSON.stringify(response));
}

//-------------- EMail versenden
async function sendMail(bestell_id) {
  let envelope = {
    from: '"mypizza" <mypizza.ibsprojekt@gmail.com>', // absender Adresse
    to: "mypizza.ibsprojekt@gmail.com", // empfänger -> email des angemeldeten Users
    subject: "MyPizza - Deine Bestellung", // Betreffzeile
    text: "Test vom IBS-node Server :)", // plain text body
    html: "<b>Test vom IBS-node Server :)</b>" // html body
  };

  let bestellung = cache.get(bestell_id);
  let mailtext = "Deine Bestellung \n\n\nLieferort:\n";
  let mailhtml = "<h1>Deine Bestellung</h1>";
  mailhtml += "<h3>Lieferort:</h3>";

  //Daten aus DB abfragen:
  let kundequery =
    "SELECT vorname, nachname, adr_id FROM kunde WHERE email = ?";
  let kunderesult = await conn.query(kundequery, [bestellung.email]);
  let adrquery =
    "SELECT strasse, hausnr, plz, ort FROM adresse WHERE adr_id = ?";
  let adrresult = await conn.query(adrquery, [kunderesult[0].adr_id]);

  mailtext += kunderesult[0].vorname + " " + kunderesult[0].nachname + "\n";
  mailtext += adrresult[0].strasse + " " + adrresult[0].hausnr + "\n";
  mailtext += adrresult[0].plz + " " + adrresult[0].ort + "\n\nPizzen:\n";

  mailhtml += kunderesult[0].vorname + " " + kunderesult[0].nachname + "<br>";
  mailhtml += adrresult[0].strasse + " " + adrresult[0].hausnr + "<br>";
  mailhtml +=
    adrresult[0].plz + " " + adrresult[0].ort + "<br><hr><h3>Pizzen:</h3>";

  // Liste alle Pizzen auf:
  for (let i = 0; i < Object.keys(bestellung.pizzen).length; i++) {
    mailtext +=
      bestellung.pizzen[i].name + "   |" + bestellung.pizzen[i].preis + " €\n";

    mailhtml +=
      bestellung.pizzen[i].name +
      "   | " +
      bestellung.pizzen[i].preis +
      " € <br>";
  }

  mailtext += "---------------------------\n";
  mailtext += "Gesamtpreis: " + bestellung.gesamtpreis + " €";

  mailhtml += "<hr> Gesamtpreis: " + bestellung.gesamtpreis + " € <br>";

  // baue EMail
  envelope.to = bestellung.email;
  envelope.text = mailtext;
  envelope.html = mailhtml;

  // Sende EMail
  transporter
    .sendMail(envelope)
    .then((info) => {
      console.log({ info });
    })
    .catch(console.error);
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid(length) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// schreibe Bestellung mit bestellid in die Datenbank
async function bestellungEintragen(bestellid) {
  var session = cache.get(bestellid);

  let query_userinfos = "SELECT kundennr, adr_id FROM kunde WHERE email = ?";
  let result_userinfos = await conn.query(query_userinfos, [session.email]);

  var query_insert_bestellung =
    "INSERT INTO bestellung (timest, kundennr, adr_id) VALUES (?,?,?)";

  // Baue Datum nach gegebenem Schema:
  var datum = dateformat(now, "yyyy-mm-dd HH:MM:ss");

  var result_insert_bestellung = await conn.query(query_insert_bestellung, [
    datum,
    result_userinfos[0].kundennr,
    result_userinfos[0].adr_id
  ]);

  var bestellid_db = result_insert_bestellung.insertId;

  let indx = Object.keys(session.pizzen).length;
  for (let i = 0; i < indx; i++) {
    var pizzaname = session.pizzen[i].name;
    var pizzapreis = session.pizzen[i].preis;

    var query_insert_pizzabestellung =
      "INSERT INTO pizzabestellung (bestell_id, name, zutat1, zutat2, zutat3, zutat4, zutat5, zutat6, zutat7, zutat8, preis) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

    var result_insert_pizzabestellung = await conn.query(
      query_insert_pizzabestellung,
      [
        bestellid_db,
        pizzaname,
        session.pizzen[i].zutat1,
        session.pizzen[i].zutat2,
        session.pizzen[i].zutat3,
        session.pizzen[i].zutat4,
        session.pizzen[i].zutat5,
        session.pizzen[i].zutat6,
        session.pizzen[i].zutat7,
        session.pizzen[i].zutat8,
        pizzapreis
      ]
    );
  }
}
