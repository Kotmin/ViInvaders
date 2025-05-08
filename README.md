# ViInvaders
Fight you favourite IDE

ArduinoJSON by Benoit

## Set-up

### Install SPIFFS Upload Tool

https://github.com/me-no-dev/arduino-esp32fs-plugin/releases

- ESPAsyncWebServer
👉 https://github.com/me-no-dev/ESPAsyncWebServer

- AsyncTCP
👉 https://github.com/me-no-dev/AsyncTCP


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

