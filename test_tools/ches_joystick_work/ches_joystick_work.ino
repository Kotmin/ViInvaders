#define JOY1_X 34
#define JOY1_SW 25
#define JOY2_X 35
#define JOY2_SW 26

void setup() {
  Serial.begin(115200);
  pinMode(JOY1_SW, INPUT_PULLUP);
  pinMode(JOY2_SW, INPUT_PULLUP);
}

void loop() {
  int x1 = analogRead(JOY1_X);
  int x2 = analogRead(JOY2_X);
  bool fire1 = digitalRead(JOY1_SW) == LOW;
  bool fire2 = digitalRead(JOY2_SW) == LOW;

  Serial.print("J1: "); Serial.print(x1);
  if (fire1) Serial.print(" [FIRE] ");
  Serial.print(" | J2: "); Serial.print(x2);
  if (fire2) Serial.print(" [FIRE]");
  Serial.println();

  delay(200);
}
