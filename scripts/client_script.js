// Allgemeine funktionen, welche immer benötigt werden

var erg;

async function anmeldestatus() {
  var response = await fetch("/anmeldestatus.js");
  var content = await response.text();

  if (isValidJson(content)) {
    var json_data = JSON.parse(content);
  }

  alert(json_data.status);
  erg = json_data.status;
}

function updateAnmeldestatus() {
  let anmeldeSpan = document.getElementById(anmeldestatus);
  anmeldeSpan = erg;
}

function isValidJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
