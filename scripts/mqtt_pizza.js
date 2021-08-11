var message;

window.onload = async function () {
  message = mqtt_fetch("pizza");
  await message.init("localhost", 1884);
  message.set_callback(-1, "test", false);
  document
    .getElementById("addPizzaButton")
    .addEventListener("click", mqtt_send);
};

async function mqtt_send() {
  console.log("-> mqtt_send");
  var result = await message.send({
    action: "get_bestellung",
    test: "Hallo"
  });
  document.getElementById("mqttres").innerText = JSON.stringify(result);
}
