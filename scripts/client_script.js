// Allgemeine funktionen, welche immer benötigt werden

var erg;

async function anmeldestatus() {
  var response = await fetch("/anmeldestatus.js");
  var content = await response.text();

  if (isValidJson(content)) {
    var json_data = JSON.parse(content);
  }

  alert(json_data.status);
  var status = json_data.status;

  alert(json_data.vorname + " " + json_data.nachname);
  let anmeldeSpan = document.getElementById("anmeldestatus");

  if (erg == "angemeldet") {
    var user = " als " + json_data.vorname + " " + json_data.nachname;

    anmeldeSpan.innerText = status + user;
  } else {
    anmeldeSpan.innerText = status;
  }
}

function isValidJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
