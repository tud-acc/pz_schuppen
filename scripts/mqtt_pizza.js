var message;

async function nofuckyou() {
  message = new mqtt_fetch("pizza");
  console.log("message: " + message);
  await message.init("193.197.231.154", 1884);
  message.set_callback(-1, "test", false);
  /*document
    .getElementById("addPizzaButton")
    .addEventListener("click", mqtt_send);*/
}

async function mqtt_sendr() {
  console.log("-> mqtt_send");
  var result = await message.send({
    action: "add_Pizza",
    bestellid: "123",
    pizza: { name: "pizza1", preis: "6,50€" }
  });
  document.getElementById("mqttres").innerText = JSON.stringify(result);
}
