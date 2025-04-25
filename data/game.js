const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let ship = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 30,
  height: 30,
  speed: 5
};

let bullets = [];
let enemies = [];
let lastShotTime = 0;

function createEnemies() {
  const rows = 2;
  const cols = 6;
  const spacing = 60;

  enemies = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      enemies.push({
        x: 100 + col * spacing,
        y: 50 + row * spacing,
        dx: 1,
        type: ["vi", "vim", "neovim"][Math.floor(Math.random() * 3)]
      });
    }
  }
}

function drawShip() {
  ctx.fillStyle = "white";
  ctx.fillRect(ship.x - ship.width / 2, ship.y, ship.width, ship.height);
}

function drawBullets() {
  ctx.fillStyle = "cyan";
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));
}

function drawEnemies() {
  ctx.fillStyle = "red";
  ctx.font = "16px monospace";
  enemies.forEach(e => ctx.fillText(e.type, e.x, e.y));
}

function updateBullets() {
  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= 7);
}

function updateEnemies() {
  enemies.forEach(e => {
    e.x += e.dx;
    if (e.x < 0 || e.x > canvas.width - 30) {
      e.dx *= -1;
      e.y += 10;
    }
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShotTime >= 1000) {
    bullets.push({ x: ship.x, y: ship.y });
    lastShotTime = now;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawShip();
  drawEnemies();
  drawBullets();
  updateBullets();
  updateEnemies();
  requestAnimationFrame(draw);
}

// Keyboard input
document.addEventListener("keydown", e => {
  if (e.key === "a") ship.x -= ship.speed;
  if (e.key === "d") ship.x += ship.speed;
  if (e.key === " ") shoot();
});

// Touch input (left/right/center = shoot)
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const x = e.touches[0].clientX;
  const canvasX = canvas.getBoundingClientRect().left;
  const relativeX = x - canvasX;

  if (relativeX < canvas.width / 3) {
    ship.x -= ship.speed * 2;
  } else if (relativeX > 2 * canvas.width / 3) {
    ship.x += ship.speed * 2;
  } else {
    shoot();
  }
}, { passive: false });

createEnemies();
draw();
