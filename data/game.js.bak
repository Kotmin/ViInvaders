const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const playerColors = ["white", "lime", "cyan", "orange", "violet"];
const enemyTypes = ["vi", "vim", "neovim"];
let enemyBullets = [];
let gameOver = false;
let level = 1;

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
    this.lives = 3;
    this.score = 0;
    this.alive = true;
    this.respawnTimer = 0;
    this.respawnCountdown = null;
  }

  draw() {
    if (this.active && this.alive) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    } else if (!this.alive && this.lives > 0) {
      const secondsLeft = Math.ceil((5000 - (Date.now() - this.respawnTimer)) / 1000);
      ctx.fillStyle = "white";
      ctx.font = "14px sans-serif";
      ctx.fillText(`P${this === player1 ? 1 : 2} respawn in ${secondsLeft}`, this.x - 40, this.y - 10);
    }
  }

  shoot() {
    const now = Date.now();
    if (now - this.lastShot > 1000 && this.active && this.alive) {
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

  takeHit() {
    if (!this.alive || this.lives <= 0) return;
    this.lives -= 1;
    this.alive = false;
    this.respawnTimer = Date.now();
  }

  updateRespawn() {
    if (!this.alive && this.lives > 0) {
      const now = Date.now();
      if (now - this.respawnTimer >= 5000) {
        this.alive = true;
      }
    }
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

    if (this.y > canvas.height - 100 && !gameOver) {
      gameOver = true;
      setTimeout(() => alert("Game Over – wróg dotarł do bazy!"), 10);
    }
  }
}

let player1, player2;
let enemies = [];

function newGame() {
  player1 = new Player(canvas.width / 2 - 60, randomColor());
  player2 = new Player(canvas.width / 2 + 60, randomColor());
  enemyBullets = [];
  level = 1;
  gameOver = false;
  createEnemies();
}

function randomColor() {
  return playerColors[Math.floor(Math.random() * playerColors.length)];
}

function createEnemies() {
  enemies = [];
  const rows = 2 + level;
  const cols = 4 + level;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      enemies.push(new Enemy(60 + col * 60, 50 + row * 40, enemyTypes[Math.floor(Math.random() * 3)]));
    }
  }
}

function checkCollisions(player) {
  player.bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      if (b.x > e.x - 10 && b.x < e.x + 30 && b.y < e.y + 16 && b.y > e.y) {
        enemies.splice(j, 1);
        player.bullets.splice(i, 1);
        player.score += 1;
      }
    });

    enemyBullets.forEach((eb, k) => {
      if (b.x > eb.x - 4 && b.x < eb.x + 4 && b.y < eb.y + 10 && b.y > eb.y) {
        enemyBullets.splice(k, 1);
        player.bullets.splice(i, 1);
      }
    });
  });
}

function checkPlayerHit(player) {
  if (!player.alive) return;
  enemyBullets.forEach((b, i) => {
    if (
      b.x > player.x - player.width / 2 &&
      b.x < player.x + player.width / 2 &&
      b.y > player.y &&
      b.y < player.y + player.height
    ) {
      player.takeHit();
      enemyBullets.splice(i, 1);
    }
  });
}

function updateEnemyBullets() {
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
  enemyBullets.forEach(b => {
    b.y += 4;
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x - 2, b.y, 4, 10);
  });
}

function enemyFire() {
  if (enemies.length === 0 || gameOver) return;
  const shooter = enemies[Math.floor(Math.random() * enemies.length)];
  enemyBullets.push({ x: shooter.x + 10, y: shooter.y + 10 });
}

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText(`P1: x${player1.lives} (${player1.score})`, 20, 20);
  ctx.fillText(`P2: x${player2.lives} (${player2.score})`, canvas.width - 180, 20);
  ctx.fillText(`Level: ${level}`, canvas.width / 2 - 30, 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
    return;
  }

  player1.updateRespawn();
  player2.updateRespawn();

  player1.draw();
  player1.updateBullets();
  checkCollisions(player1);
  checkPlayerHit(player1);

  if (player2.active) {
    player2.draw();
    player2.updateBullets();
    checkCollisions(player2);
    checkPlayerHit(player2);
  }

  enemies.forEach(e => {
    e.update();
    e.draw();
  });

  updateEnemyBullets();
  drawHUD();

  // Level progression
  if (enemies.length === 0 && !gameOver) {
    level++;
    createEnemies();
  }

  requestAnimationFrame(draw);
}

setInterval(enemyFire, 1500);
newGame();
draw();

// Input: keyboard
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

  if (e.key === "ArrowLeft") {
    player2.x -= player2.speed;
    player2.active = true;
  }
  if (e.key === "ArrowRight") {
    player2.x += player2.speed;
    player2.active = true;
  }
  if (e.key === "ArrowUp") {
    player2.shoot();
    player2.active = true;
  }

  if (e.key === "r") {
    newGame();
  }
});

// Input: touch
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

// Input: joystick (WebSocket)
const ws = new WebSocket("ws://" + location.hostname + "/ws");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

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
