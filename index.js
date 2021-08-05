
doctype html
html
  head
    title Pizzaladen
  body
    div(class='header')
      div(class='logo')
      div(class='menu')
        - var url_anmelden = "anmelde url";
        a(href='/'+url_anmelden class='button') Anmelden
        |
        |
        - var url_registrieren = "registrier url";
        a(href='/'+url_registrieren class='button') Registrieren
        |
        |
        - var url_bestellen = "bestell url";
        a(href='/'+url_bestellen class='button') Bestellen
        |
        |


    div(class='content')
      div(class='half')
        div#pizza
        
      div(class='half')
        div#alexa
          h2 Bestelle mit Amazon alexa
          p 
          | Text test test test



