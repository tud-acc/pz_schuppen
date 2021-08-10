


session{
  "email": xyz
  "session_id":
  "session_id_kurz":
  "gesamtpreis":
  pizzen:
    [
      pizza1: [salami, käse, etc.],
      pizza2: []
      ..
      .
    ]

    "Basispizza":[{"pizza_id":1,"name":"Margherita","zutat1":null,"zutat2":null,"zutat3":null,"zutat4":null,"zutat5":null,"zutat6":null,"zutat7":null,"zutat8":null},
    {"pizza_id":2,"name":"Speziale","zutat1":1,"zutat2":2,"zutat3":3,"zutat4":null,"zutat5":null,"zutat6":null,"zutat7":null,"zutat8":null},{"pizza_id":3,"name":"Diavola","zutat1":1,"zutat2":2,"zutat3":7,"zutat4":15,"zutat5":null,"zutat6":null,"zutat7":null,"zutat8":null}]}

}

function isloggedin(){
  var json_object = cache.get(session_id);
  var email = json_object.email;

  if(email === ""){
    return false;
  }else{
    return true;
  }
}

function isloggedin2str(){

  if(isloggedin){
    var json_object = cache.get(session_id);
    var email = json_object.email;
    var vorname = json_object.

    return Angemeldet: 

  }else{
    return "Nicht angemeldet";
  }
}

















