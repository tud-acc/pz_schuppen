async function init() {
  var err = false;
  var errtext = document.createTextNode("Fehler beim Laden der Zutaten");
  var tablenode = document.getElementById("tablecontainer");
  var dropdown = document.getElementById("basispizzaliste");

  var response = await fetch("/zutaten.js");
  var content = await response.text();

  if (isValidJson(content)) {
    var jobj = JSON.parse(content);
    var table = document.createElement("table");
    table.setAttribute("border", "1");

    var trh = document.createElement("tr");
    var thZutat = document.createElement("th");
    var thPreis = document.createElement("th");
    var thSelect = document.createElement("th");

    thZutat.appendChild(document.createTextNode("Zutat"));
    thPreis.appendChild(document.createTextNode("Aufpreis"));
    thSelect.appendChild(document.createTextNode("Ausgewählt"));
    trh.appendChild(thZutat);
    trh.appendChild(thPreis);
    trh.appendChild(thSelect);
    table.appendChild(trh);

    if (jobj != null) {
      err = Object.keys(jobj).length > 0 ? false : true;

      let i;
      for (i = 0; i < Object.keys(jobj.Zutaten).length; i++) {
        var tr = document.createElement("tr"); // neue Zeile

        var tdZutat = document.createElement("td");
        var tdPreis = document.createElement("td");
        var tdSelect = document.createElement("td");

        var zutat = document.createTextNode(jobj.Zutaten[i].bezeichnung);
        var preis = document.createTextNode(jobj.Zutaten[i].preis + " €");
        var select = document.createElement("input");
        select.type = "checkbox";
        select.id = zutat; // setze id auf zutatname (zutat kommt nur ein mal vor)

        tdZutat.appendChild(zutat);
        tdPreis.appendChild(preis);
        tdSelect.appendChild(select);
        tr.appendChild(tdZutat);
        tr.appendChild(tdPreis);
        tr.appendChild(tdSelect);

        table.appendChild(tr);
      }

      let j;
      for (j = 0; j < Object.keys(jobj.Basispizza).length; j++) {
        let option = document.createElement("option");
        option.value = jobj.Basispizza[j].name;
        option.text = jobj.Basispizza[j].name;
        dropdown.append(option);
      }
    } else {
      err = true;
    }

    if (!err) {
      //TODO: get element by id & append table as child

      tablenode.appendChild(table);
    } else {
      tablenode.appendChild(errtext);
    }
  } else {
    tablenode.appendChild(errtext);
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
