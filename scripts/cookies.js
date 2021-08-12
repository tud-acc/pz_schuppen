if (Cookies.get("test") === "undefined") {
  Cookies.set("test", test_id);
} else {
  alert("Angemeldet mit der ID: " + Cookies.get("test"));
}

/*
  if (Cookies.get("ip") === req.ip) {
    console.dir("Du warst schon mal hier");
    console.dir("Deine IP aus dem Cookie: " + Cookies.get("ip"));
  } else {
    console.dir("Du bist neu hier");
    Cookies.set("ip", req.ip);
  }
  */
