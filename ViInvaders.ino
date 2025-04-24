#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>


#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

const char* ssid = "ViInvaders";
const char* password = "editorwar";

AsyncWebServer server(80);

void setup() {
  Serial.begin(115200);

  // Start SPIFFS
  if(!SPIFFS.begin(true)){
    Serial.println("Błąd SPIFFS");
    return;
  }

  // Tryb Access Point
  WiFi.softAP(ssid, password);
  Serial.println("Access Point uruchomiony");
  Serial.println(WiFi.softAPIP());

  // Serwowanie plików
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", "text/html");
  });

  server.serveStatic("/", SPIFFS, "/");

  server.begin();
}

void loop() {
  // async - sh
}
