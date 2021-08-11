var message;

window.onload = async function () {
  message = mqtt_fetch("pizza");
  await message.init("localhost");
};
