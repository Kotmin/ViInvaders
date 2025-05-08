#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>


#include <WiFi.h>
#include <SPIFFS.h>

#include <ArduinoJson.h>


const char* ssid = "ViInvaders";
const char* password = "editorwar";

AsyncWebServer server(80);

AsyncWebSocket ws("/ws");  // websocket endpoint

// joystick pinout
#define JOY1_X 34
#define JOY1_SW 25
#define JOY2_X 35
#define JOY2_SW 26

void notifyClients() {
  StaticJsonDocument<128> doc;

  doc["j1x"] = analogRead(JOY1_X);
  doc["j1f"] = digitalRead(JOY1_SW) == LOW;
  doc["j2x"] = analogRead(JOY2_X);
  doc["j2f"] = digitalRead(JOY2_SW) == LOW;

  String msg;
  serializeJson(doc, msg);
  ws.textAll(msg);
}


void setup() {
  Serial.begin(115200);
  pinMode(JOY1_SW, INPUT_PULLUP);
  pinMode(JOY2_SW, INPUT_PULLUP);

  // Start SPIFFS
  if(!SPIFFS.begin(true)){
    Serial.println("Błąd SPIFFS");
    return;
  }

  //  Access Point Mode
  WiFi.softAP(ssid, password);
  Serial.println("Access Point uruchomiony");
  Serial.println(WiFi.softAPIP());

  // File serve
  server.serveStatic("/", SPIFFS, "/");
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", "text/html");
  });

  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
                AwsEventType type, void *arg, uint8_t *data, size_t len) {
    // optional: handle messages from clients
  });
  server.addHandler(&ws);

  server.begin();
}

void loop() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 50) {
    notifyClients();
    lastSend = millis();
  }
}
