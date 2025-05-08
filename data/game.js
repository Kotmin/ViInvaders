const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const playerColors = ["white", "lime", "cyan", "orange", "violet"];
const enemyTypes = ["vi", "vim", "neovim"];

class Player {
  constructor(x, color) {
    this.x = x;
    this.y = canvas.height - 50;
    this.width = 30;
    this.height = 30;
    this.speed = 7;
    this.color = color;
    this.bullets = [];
    this.lastShot = 0;
    this.active = false;
  }

  draw() {
    if (this.active) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    }
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShot > 1000 && this.active) {
      this.bullets.push({ x: this.x, y: this.y });
      this.lastShot = now;
    }
  }

  updateBullets() {
    this.bullets = this.bullets.filter(b => b.y > 0);
    this.bullets.forEach(b => b.y -= 7);
    ctx.fillStyle = this.color;
    this.bullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));
  }
}

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.dx = 1;
    this.type = type;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.font = "16px monospace";
    ctx.fillText(this.type, this.x, this.y);
  }

  update() {
    this.x += this.dx;
    if (this.x < 0 || this.x > canvas.width - 30) {
      this.dx *= -1;
      this.y += 10;
    }
  }
}

const player1 = new Player(canvas.width / 2 - 60, playerColors[Math.floor(Math.random() * playerColors.length)]);
const player2 = new Player(canvas.width / 2 + 60, playerColors[Math.floor(Math.random() * playerColors.length)]);


const ws = new WebSocket("ws://" + location.hostname + "/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // joystick 1
  if (data.j1x < 1500) {
    player1.x -= player1.speed;
    player1.active = true;
  } else if (data.j1x > 3500) {
    player1.x += player1.speed;
    player1.active = true;
  }
  if (data.j1f) {
    player1.shoot();
    player1.active = true;
  }

  // joystick 2
  if (data.j2x < 1500) {
    player2.x -= player2.speed;
    player2.active = true;
  } else if (data.j2x > 3500) {
    player2.x += player2.speed;
    player2.active = true;
  }
  if (data.j2f) {
    player2.shoot();
    player2.active = true;
  }
};



let enemies = [];

function createEnemies() {
  enemies = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      enemies.push(new Enemy(100 + col * 60, 50 + row * 50, enemyTypes[Math.floor(Math.random() * 3)]));
    }
  }
}

function checkCollisions(player) {
  player.bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      if (
        b.x > e.x - 10 &&
        b.x < e.x + 30 &&
        b.y < e.y + 16 &&
        b.y > e.y
      ) {
        // trafienie
        enemies.splice(j, 1);
        player.bullets.splice(i, 1);
      }
    });
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player1.draw();
  player1.updateBullets();
  checkCollisions(player1);

  if (player2.active) {
    player2.draw();
    player2.updateBullets();
    checkCollisions(player2);
  }

  enemies.forEach(e => {
    e.update();
    e.draw();
  });

  requestAnimationFrame(draw);
}

createEnemies();
draw();

// Klawiatura – player 1: A/D/Spacja
document.addEventListener("keydown", (e) => {
  if (e.key === "a") {
    player1.x -= player1.speed;
    player1.active = true;
  }
  if (e.key === "d") {
    player1.x += player1.speed;
    player1.active = true;
  }
  if (e.key === " ") {
    player1.shoot();
    player1.active = true;
  }

  // Klawiatura – player 2: ←/→/Enter
  if (e.key === "ArrowLeft") {
    player2.x -= player2.speed;
    player2.active = true;
  }
  if (e.key === "ArrowRight") {
    player2.x += player2.speed;
    player2.active = true;
  }
  if (e.key === "Enter") {
    player2.shoot();
    player2.active = true;
  }
});

// Dotyk (prosty) – steruje player1
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const x = e.touches[0].clientX;
  const relX = x - canvas.getBoundingClientRect().left;

  player1.active = true;
  if (relX < canvas.width / 3) {
    player1.x -= player1.speed * 1.5;
  } else if (relX > 2 * canvas.width / 3) {
    player1.x += player1.speed * 1.5;
  } else {
    player1.shoot();
  }
}, { passive: false });
