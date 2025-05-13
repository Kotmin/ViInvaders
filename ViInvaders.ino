#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
// #include <HTTPClient.h>


#include <WiFi.h>
#include <SPIFFS.h>

#include <ArduinoJson.h>
// External Internet Source
const char* ssid_sta = "NetworkName";
const char* password_sta = "SecretPassword";

// AP: for players
const char* ssid = "ViInvaders";
const char* password = "editorwar";

AsyncWebServer server(80);

AsyncWebSocket ws("/ws");  // websocket endpoint

// joystick pinout
#define JOY1_X 34
#define JOY1_SW 25
#define JOY2_X 35
#define JOY2_SW 26

const char* quoteCachePath = "/quote.json";
const char* quoteAPI = "https://api.quotable.io/random?maxLength=120&tags=technology|motivational|famous-quotes";


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

// void fetchAndCacheQuote() {
//   if (WiFi.status() == WL_CONNECTED) {
//     HTTPClient http;
//     http.begin(quoteAPI);
//     int httpCode = http.GET();

//     if (httpCode == 200) {
//       String payload = http.getString();
//       File file = SPIFFS.open(quoteCachePath, FILE_WRITE);
//       if (file) {
//         file.print(payload);
//         file.close();
//         Serial.println("Quote downloaded and cached.");
//       }
//     } else {
//       Serial.printf("HTTP error: %d\n", httpCode);
//     }

//     http.end();
//   } else {
//     Serial.println("No internet: skipping quote fetch");
//   }
// }



void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("[WS] Client %u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("[WS] Client %u disconnected\n", client->id());
      break;
    case WS_EVT_ERROR:
      Serial.printf("[WS] Error on client %u\n", client->id());
      break;
    case WS_EVT_DATA:
      // Optional: handle incoming client messages here
      break;
    default:
      break;
  }
}


void setup() {
  Serial.begin(115200);
  pinMode(JOY1_SW, INPUT_PULLUP);
  pinMode(JOY2_SW, INPUT_PULLUP);

  // Start SPIFFS
  if(!SPIFFS.begin(true)){
    Serial.println("SPIFFS Error");
    return;
  }

  // WiFi.mode(WIFI_AP_STA);  // both: client + AP - AP just for players do not provide InternetAccess

  // // STA (Internet)
  // WiFi.begin(ssid_sta, password_sta);
  // Serial.print(" Wi-Fi (STA) connecting: ");
  // for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; ++i) {
  //   delay(500);
  //   Serial.print(".");
  // }
  // if (WiFi.status() == WL_CONNECTED) {
  //   Serial.println("\nConnected with WAN:");
  //   Serial.println(WiFi.localIP());
  // } else {
  //   Serial.println("\nCannot conect to the Internet");
  // }


  //  Access Point Mode
  WiFi.softAP(ssid, password);
  Serial.println("Access Point enabled");
  Serial.println(WiFi.softAPIP());

  // File serve
  server.serveStatic("/", SPIFFS, "/");
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", "text/html");
  });

  // ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
  //               AwsEventType type, void *arg, uint8_t *data, size_t len) {
  //   // optional: handle messages from clients
  // });

   // Endpoint to serve quote (cached / fallback)
  // server.on("/quote", HTTP_GET, [](AsyncWebServerRequest *request) {
  //   if (SPIFFS.exists(quoteCachePath)) {
  //     request->send(SPIFFS, quoteCachePath, "application/json");
  //   } else {
  //     StaticJsonDocument<192> doc;
  //     doc["content"] = "No internet. Stay sharp, Commander!";
  //     doc["author"] = "ESP32";
  //     String out;
  //     serializeJson(doc, out);
  //     request->send(200, "application/json", out);
  //   }
  // });
  
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);

  server.begin();
  // fetchAndCacheQuote();
}

void loop() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 50) {
    notifyClients();
    lastSend = millis();
  }
  ws.cleanupClients(); // rm unactive clients
}
