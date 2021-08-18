// Allgemeine funktionen, welche immer benötigt werden

async function anmeldestatus() {
  var response = await fetch("/anmeldestatus.js");
  var content = await response.text();

  if (isValidJson(content)) {
    var json_data = JSON.parse(content);
  }

  alert(json_data[0]);
  alert(json_data.status);
  alert("blablablubb");
}

function isValidJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
