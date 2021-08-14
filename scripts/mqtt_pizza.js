var message;
var bestellid;

async function nofuckyou() {
  message = new mqtt_fetch("pizza");
  console.log("message: " + message);
  await message.init("193.197.231.154", 1884);
  message.set_callback(-1, rx_status, false);
  /*document
    .getElementById("addPizzaButton")
    .addEventListener("click", mqtt_send);*/
  requestBestellListe();
  document
    .getElementById("addPizzaButton")
    .addEventListener("click", tx_addPizza);
}

// füge pizza der bestellung hinzu
async function tx_addPizza() {
  console.log("-> mqtt_send");
  var result = await message.send({
    action: "add_Pizza",
    bestellid: bestellid,
    pizza: buildPizzaJson()
  });
  document.getElementById("mqttres").innerText = JSON.stringify(result);
}

//entferne pizza aus einer Bestellung
async function tx_delPizza(pizza) {
  console.log("-> mqtt_delPizza");
  var result = await message.send({
    action: "del_Pizza",
    bestellid: bestellid,
    pizzaid: pizza
  });
  document.getElementById("mqttres").innerText = JSON.stringify(result);
}

// initiales anfragen einer bestellliste,
async function requestBestellListe() {
  //versuche bestell-id aus URL Parametern zu lesen:
  // z.B.: 193.197.231.154/bestellen.js?id=123
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  console.log("urlParams: " + urlParams);
  bestellid = urlParams.get("id");

  // prüfe ob bestellid in url vorhanden:
  if (bestellid == null) {
    // versuche coockie zu lesen
    let cookieBestId = Cookies.get("bestellid");
    if (cookieBestId === undefined) {
      // keine Bestell-ID auslesbar, abfrage per fenster anzeigen:
      bestellid = window.prompt(
        "Geben Sie eine BestellID ein oder Melden Sie sich an um eine neue Bestellung zu starten."
      );
      //alert("Melde dich an um eine Bestellung zu starten.");
      //return; // keine bestellid -> abbruch
    }
  }

  console.log("funccall requestBestellListe");
  let req = await message.send({
    action: "get_bestellung",
    bestellid: bestellid
  });
  rx_bestellung("pizza", req);
  // subscribe channel für bestellid
  message.set_callback("pizza/orders/" + bestellid, rx_bestellung, true);
}

// Hilfsfunktion mqtt status anzeigen
function rx_status(data) {
  console.log("rx_status", data);
  document.getElementById("status").innerText = JSON.stringify(data);
}

// empfange mqtt bestellliste, zeige diese unter Bestellung an.
function rx_bestellung(topic, data) {
  console.log(topic, data);
  document.getElementById("mqttres").innerText = JSON.stringify(data);

  // prüfe ob Fehler zurückkommt (bestellung existiert nicht)
  if (data.rc < 0) {
    document.getElementById("status").innerText = data.message;
    return;
  }

  let bestellliste = document.getElementById("bestellliste");
  bestellliste.innerHTML = ""; // löche alle childNodes
  console.log(data);
  console.log(data.pizzen);

  for (let i = 0; i < Object.keys(data.pizzen).length; i++) {
    let card = document.createElement("div");
    card.id = data.pizzen[i].bestellnr;
    let pizzatext = document.createElement("span");
    let deletebutton = document.createElement("button");
    deletebutton.setAttribute("class", "button red marging-left16");
    deletebutton.textContent = "x";
    deletebutton.id = "deletePizza" + data.pizzen[i].bestellnr;
    // eventhandler löschen der Pizza
    deletebutton.addEventListener("click", tx_delPizza, deletebutton.id);

    pizzatext.innerText =
      data.pizzen[i].bestellnr +
      ".  | " +
      data.pizzen[i].name +
      "  |  " +
      data.pizzen[i].preis +
      " €";

    card.appendChild(pizzatext);
    card.appendChild(deletebutton);
    bestellliste.appendChild(card);
  }
  document.getElementById("gesbetrag").innerText = data.preis;
}
