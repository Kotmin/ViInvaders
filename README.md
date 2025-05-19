# 🎮 Vi Invaders: Multiplayer Retro Shooter on ESP32
**Vi Invaders** is a minimalist two-player retro shooter running fully on an ESP32. The game is served via Wi-Fi from the device itself, requiring no Internet connection — but able to fetch content like motivational quotes when available.



<div align="center">
<img width="709" alt="db_schema_default" src="https://github.com/user-attachments/assets/f56b8070-8394-41ee-aaae-8141bb329fca">
</div>

## ✨ Features

- **🕹 Dual Player Support via Joysticks**: Two analog joysticks connected to GPIO control player movement and shooting.
- **⌨️ Additional Control Options**:
  - Player 1: <kbd>A</kbd><kbd>D</kbd> + <kbd>Space</kbd>
  - Player 2: <kbd>←</kbd><kbd>→</kbd> + <kbd>Enter/Return</kbd>
  - Player 1 can also control the game via **touch** (e.g. on mobile).
- **📡 Real-Time Control**: Joystick states are streamed over local WebSockets to control players in the browser.
- **🌐 Motivational Quotes**:
  - On startup, ESP32 attempts to fetch 20 quotes from [`quotable.io`](https://api.quotable.io).
  - If successful, they're cached and served from `/quote`.
  - The **start screen** displays a random quote — either from API, ESP32 cache, or a built-in fallback.
  - If ESP lacks connectivity, the game attempts to use the **client’s internet** for the same purpose.
- **🕹 Local Access Point**: ESP32 creates a Wi-Fi network (`ViInvaders`) for players to join with no external router needed.
- **🎮 Fast & Playable**: Full gameplay loop runs in browser via HTML5 Canvas and JavaScript.

---

## 🛠 Requirements

- ESP32 Dev Board
- 2 analog joysticks with digital fire buttons
- Any browser-capable device (PC, tablet, phone)

---

## 🧠 Inspirations

- Space Invaders-style layout
- Classic editor wars: `vi`, `vim`, `neovim` as enemies
- Nerdy + motivational start quotes, from Shepard to Psycho

---


## 🚀 How It Works

1. On boot, ESP32 tries to connect to an external Wi-Fi (to fetch motivational quotes).
2. If successful, it downloads and caches 20 quotes from [`quotable.io`](https://api.quotable.io).
3. ESP32 then starts a local access point for players to join and play.
4. Players connect to `http://192.168.4.1` (default ip) via browser, and joystick movements are streamed live.
5. Game logic (collision, shooting, level progression) is handled entirely client-side.
6. Game continues even without Internet – quotes will fallback to built-in messages.


---

## ⚠️ Notes & Limitations

- **No AI**: Enemies move on a simple grid pattern — no pathfinding or decision-making logic is implemented.
- **No Game Session Tracking**: The ESP32 does **not** track players or sessions. Multiple clients can connect, resulting in parallel independent games — sharing the same joystick inputs.
- **WebSocket Performance**: Under heavy load or with multiple devices, input lag may occur due to limited hardware and single-channel WebSocket handling.
- **Scaling**: While the canvas tries to auto-scale to 4:3 aspect ratio, rendering may appear stretched or misaligned on extreme screen dimensions.


---

## 🔐 Privacy & Security Notes

- The ESP32 never shares the Internet with players; the AP is isolated.
- Quotes are fetched once during setup and then cached locally.
- WebSocket communication is kept local and not exposed externally.


---

## ⬇️ Connectivity Behavior

- ESP32 attempts to connect to known Wi-Fi (STA mode) at boot:
  - If **successful**, it downloads and caches 20 quotes.
  - Regardless of result, it then switches to **AP mode** and serves the game locally.
- If the device cannot fetch quotes, the frontend (JavaScript) will try using **the client’s own internet** before falling back to built-in quotes.
- **No Internet access is shared with clients.** The AP is for game access only.

---


## 🔧 Set-up

### Install SPIFFS Upload Tool

https://github.com/me-no-dev/arduino-esp32fs-plugin/releases

- ESPAsyncWebServer
👉 https://github.com/me-no-dev/ESPAsyncWebServer

- AsyncTCP
👉 https://github.com/me-no-dev/AsyncTCP


⏫ Both by ESP32Async


- ArduinoJson by Benoit Blanchon
  👉  https://arduinojson.org/?utm_source=meta&utm_medium=library.properties

\* NOTE: SPIFFS works properly with Arduino IDE < v2.0.0. You might use it via command-line.



🔌 Joystick 1
| Joystick Pin | ESP32 Pin | Add                       |
| ------------ | --------- | ------------------------- |
| GND          | GND       | np.  pin 38               |
| +5V (VCC)    | 3V3       | pin 1 –  3.3V             |
| VRx          | GPIO34    | pin 6 – ADC, OK           |
| SW           | GPIO25    | pin 10 – INPUT\_PULLUP OK |

🔌 Joystick 2
| Joystick Pin | ESP32 Pin | Add                       |
| ------------ | --------- | ------------------------- |
| GND          | GND       |   GND                     |
| +5V (VCC)    | 3V3       | pin 1                     |
| VRx          | GPIO35    | pin 5 – ADC, OK           |
| SW           | GPIO26    | pin 11 – INPUT\_PULLUP OK |



## 🧰 How to install?
After proper set up. Upload static files via Sketch Data Upload


![obraz](https://github.com/user-attachments/assets/bbdb1298-18f8-42e7-82ad-36f0d95774d4)

After that upload ino file to controller.


## Espressif ESP32 ESP-WROOM-32 DevKit pinout 
https://cdn.forbot.pl/blog/wp-content/uploads/2020/01/ESP_32_DEVKIT_PINOUT.png

<div align="center">
<img width="709" alt="db_schema_default" src="https://cdn.forbot.pl/blog/wp-content/uploads/2020/01/ESP_32_DEVKIT_PINOUT.png">
</div>


## ℹ️ Additional sources:

https://forbot.pl/blog/leksykon/esp32
https://www.espressif.com/en/products/devkits/esp32-devkitc/overview


https://docs.arduino.cc/software/ide-v2/tutorials/getting-started-ide-v2/


And huge community on YouTube 😸


---

**Built for fun, code battles, and retro vibes. Self-hosted. No backend. No dependencies. Just ESP32.**



