var message;

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

async function tx_addPizza() {
  console.log("-> mqtt_send");
  var result = await message.send({
    action: "add_Pizza",
    bestellid: "123",
    pizza: buildPizzaJson()
  });
  document.getElementById("mqttres").innerText = JSON.stringify(result);
}

async function requestBestellListe() {
  //versuche bestell-id aus URL Parametern zu lesen:
  // z.B.: 193.197.231.154/bestellen.js?id=123
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  console.log("urlParams: " + urlParams);
  let urlBestId = urlParams.get("id");

  // prüfe ob bestellid in url vorhanden:
  if (urlBestId == null) {
    // versuche coockie zu lesen
    let cookieBestId = Cookies.get("bestellid");
    if (cookieBestId === undefined) {
      alert("Melde dich an um eine Bestellung zu starten.");
    }
  }

  console.log("funccall requestBestellListe");
  let req = await message.send({
    action: "get_bestellung",
    bestellid: urlBestId
  });
  rx_bestellung("pizza", req);
  // subscribe channel für bestellid
  message.set_callback("pizza/orders/" + urlBestId, rx_bestellung, true);
}

function rx_status(data) {
  console.log("rx_status", data);
  document.getElementById("status").innerText = JSON.stringify(data);
}

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
    let pizzatext = document.createElement("span");
    let deletebutton = document.createElement("button");
    deletebutton.setAttribute("class", "button red marging-left16");
    deletebutton.textContent = "x";
    deletebutton.id = "deletePizza" + data.pizzen[i].bestellnr;

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
}
