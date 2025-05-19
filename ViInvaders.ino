#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>

// External network (Internet)
// const char* ssid_sta = "NetworkName";
// const char* password_sta = "SecretPassword";

// Local AP (for players)
const char* ssid = "ViInvaders";
const char* password = "editorwar";

// Static IP for Access Point
IPAddress apIP(192, 168, 4, 1);
IPAddress apNetmask(255, 255, 255, 0);
IPAddress apGateway(192, 168, 4, 1);

// WebServer WebSocket
AsyncWebServer server(80);
AsyncWebSocket ws("/ws"); // websocket endpoint

// joystick pinout
#define JOY1_X 34
#define JOY1_SW 25
#define JOY2_X 35
#define JOY2_SW 26

// quotes
const char* quoteCachePath = "/quote.json";
const char* quoteAPI = "https://api.quotable.io/quotes/random?limit=20&maxLength=120&tags=technology|motivational|famous-quotes";


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

// Get and cache quotes
void fetchAndCacheQuotes() {
  HTTPClient http;
  http.begin(quoteAPI);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    File file = SPIFFS.open(quoteCachePath, FILE_WRITE);
    if (file) {
      file.print(payload);
      file.close();
      Serial.println("[Quote] 20 quotes cached.");
    } else {
      Serial.println("[Quote] Cannot write to file.");
    }
  } else {
    Serial.printf("[Quote] HTTP error: %d\n", httpCode);
  }

  http.end();
}

// WebSocket handle (for joystick communication)
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
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(JOY1_SW, INPUT_PULLUP);
  pinMode(JOY2_SW, INPUT_PULLUP);

  // Start SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("[SPIFFS] Mount failed");
    return;
  }

  // try to connect with external network
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid_sta, password_sta);
  Serial.print("[WiFi] Connecting to WAN");

  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; ++i) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected to WAN:");
    Serial.println(WiFi.localIP());
    fetchAndCacheQuotes();
  } else {
    Serial.println("\n[WiFi] Failed to connect to Internet.");
  }

  // Local AP
  WiFi.disconnect(true);
  delay(500);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apGateway, apNetmask);
  WiFi.softAP(ssid, password);

  Serial.println("[AP] Access Point started");
  Serial.print("[AP] IP: ");
  Serial.println(WiFi.softAPIP());

  // File serve
  server.serveStatic("/", SPIFFS, "/");
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });

  // Endpoint: quotes
  server.on("/quote", HTTP_GET, [](AsyncWebServerRequest *request) {
    if (SPIFFS.exists(quoteCachePath)) {
      request->send(SPIFFS, quoteCachePath, "application/json");
    } else {
      request->send(409);
    }
  });

  // WebSocket
  ws.onEvent(onWsEvent);
  server.addHandler(&ws);

  server.begin();
}

void loop() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 50) {
    notifyClients();
    lastSend = millis();
  }

  ws.cleanupClients();
}
