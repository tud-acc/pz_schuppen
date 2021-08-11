var message;

async function nofuckyou() {
  message = new mqtt_fetch("pizza");
  console.log("message: " + message);
  await message.init("193.197.231.154", 1884);
  message.set_callback("pizza", rx_bestellung, true);
  /*document
    .getElementById("addPizzaButton")
    .addEventListener("click", mqtt_send);*/
}

async function mqtt_sendr() {
  console.log("-> mqtt_send");
  var result = await message.send({
    action: "add_Pizza",
    bestellid: "123",
    pizza: buildPizzaJson()
  });
  document.getElementById("mqttres").innerText = JSON.stringify(result);
}

function rx_bestellung(topic, data) {
  console.log(topic, data);
  document.getElementById("mqttres").innerText = JSON.stringify(data);

  let bestellliste = document.getElementById("bestellliste");
  bestellliste.innerHTML = ""; // löche alle childNodes

  for (let x in data.pizzen) {
    let card = document.createElement("div");
    let pizzatext = document.createElement("span");
    let deletebutton = document.createElement("button");
    deletebutton.value = "x";

    pizzatext.innerText = x.name + "   " + x.preis + " €";

    card.appendChild(pizzatext);
    card.appendChild(deletebutton);
    bestellliste.appendChild(card);
  }
}
