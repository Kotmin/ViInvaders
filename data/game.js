const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player1 = null;
let player2 = null;
let reconnectAttempts = 0;
let reconnecting = false;
let ws = null;
let lastGameStart = 0;

const enemyFireDelays = {
  vi: 3000,
  vim: 2000,
  neovim: 1000
};



let quoteText = "";
let quoteAuthor = "";

const fallbackQuotes = [
  { text: "Keep calm and code on.", author: "Anonymous" },
  { text: "There is no place like 127.0.0.1.", author: "Unknown" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
  { text: "The best way to get a project done faster is to start sooner.", author: "Jim Highsmith" }
];
/*
async function getMotivationalQuote() {
  try {
    const res = await fetch("https://api.quotable.io/random?maxLength=120&tags=technology|motivational|famous-quotes");
    const data = await res.json();
    quoteText = data.content || fallbackQuotes[0].text;
    quoteAuthor = data.author || fallbackQuotes[0].author;
  } catch (err) {
    const fallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    quoteText = fallback.text;
    quoteAuthor = fallback.author;
  }
}

*/

async function getMotivationalQuote() {
  // 1. Try use device connection
  try {
    const online = await fetch("https://api.quotable.io/random?maxLength=120&tags=technology|motivational|famous-quotes");
    if (online.ok) {
      const data = await online.json();
      quoteText = data.content || fallbackQuotes[0].text;
      quoteAuthor = data.author || fallbackQuotes[0].author;
      return;
    }
  } catch (_) {}

  // 2. else ESP conn
  try {
    const local = await fetch("/quote");
    if (local.ok) {
      const data = await local.json();
      quoteText = data.content || fallbackQuotes[0].text;
      quoteAuthor = data.author || fallbackQuotes[0].author;
      return;
    }
  } catch (_) {}

  // 3. else local code
  const fallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  quoteText = fallback.text;
  quoteAuthor = fallback.author;
}


function resizeCanvas() {
  const ratio = 4 / 3;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w / h > ratio) {
    canvas.height = h;
    canvas.width = h * ratio;
  } else {
    canvas.width = w;
    canvas.height = w / ratio;
  }
  if (player1) {
    player1.y = canvas.height - 50;
    player1.x = canvas.width / 2 - 60;
  }
  if (player2) {
    player2.y = canvas.height - 50;
    player2.x = canvas.width / 2 + 60;
  }
}
window.addEventListener('resize', resizeCanvas);

let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
		wakeLock = await navigator.wakeLock.request('screen');
	}
  } catch (err) {
    console.warn("WakeLock error:", err);
  }
}
document.addEventListener("visibilitychange", () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    requestWakeLock();
  }
});
requestWakeLock();

const pauseBtn = document.createElement("button");
pauseBtn.innerText = "⏸️ Pause";
pauseBtn.className = "game-button";
pauseBtn.style.right = "120px";
pauseBtn.style.top = "10px";
pauseBtn.onclick = () => paused = !paused;
document.body.appendChild(pauseBtn);

const restartBtn = document.createElement("button");
restartBtn.innerText = "🔄 Reset";
restartBtn.className = "game-button";
restartBtn.style.right = "10px";
restartBtn.style.top = "10px";
restartBtn.onclick = () => newGame();
document.body.appendChild(restartBtn);

// resizeCanvas();
getMotivationalQuote();


const playerColors = ["white", "lime", "cyan", "orange", "violet"];
const enemySprites = {
  vi: new Image(),
  vim: new Image(),
  neovim: new Image()
};
enemySprites.vi.src = "/sprites/p_vi2._nt.png";
enemySprites.vim.src = "/sprites/vim.png";
enemySprites.neovim.src = "/sprites/neovim.png";

let enemyBullets = [];
let showStartScreen = true;
let gameOver = false;
let paused = false;
let level = 1;
let fireInterval = 1500;
let fireTimer;


function waitForSprites(callback) {
  const allLoaded = Object.values(enemySprites).every(img => img.complete && img.naturalHeight !== 0);
  if (allLoaded) callback();
  else setTimeout(() => waitForSprites(callback), 100);
}

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
  }

  moveLeft() {
    this.x = Math.max(this.x - this.speed, this.width / 2);
  }

  moveRight() {
    this.x = Math.min(this.x + this.speed, canvas.width - this.width / 2);
  }

  draw() {
    if (this.active && this.alive) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - 15, this.y + 30);
      ctx.lineTo(this.x + 15, this.y + 30);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
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
    } else if (gameOver) {
      newGame();
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
	this.nextFireTime = Date.now() + Math.random() * enemyFireDelays[type];
  }

  draw() {
    const sprite = enemySprites[this.type];
    if (sprite.complete && sprite.naturalHeight !== 0) {
      ctx.drawImage(sprite, this.x, this.y, 30, 30);
    } else {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, 30, 30);
    }
  }

  update() {
    if (!player1.active && !player2.active) return;
    this.x += this.dx;
    if (this.x < 0 || this.x > canvas.width - 30) {
      this.dx *= -1;
      this.y += 10;
    }
  }
  
  canFire() {
    return Date.now() >= this.nextFireTime;
  }
  
  resetFireCooldown() {
    this.nextFireTime = Date.now() + enemyFireDelays[this.type];
  }
  
}


let enemies = [];

function newGame() {
  player1 = new Player(canvas.width / 2 - 60, randomColor());
  player2 = new Player(canvas.width / 2 + 60, randomColor());
  resizeCanvas();
  enemyBullets = [];
  level = 1;
  gameOver = false;
  createEnemies();
  updateFireRate();
}

function updateFireRate() {
  clearInterval(fireTimer);
  fireInterval = Math.max(200, 1500 - level * 100);
  fireTimer = setInterval(() => {
    if (player1.active || player2.active) enemyFire();
  }, fireInterval);
}

function createEnemies() {
  enemies = [];
  const types = ["vi", "vim", "neovim"];
  const rows = 2 + level;
  const cols = 4 + level;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const type = types[Math.floor(Math.random() * types.length)];
      enemies.push(new Enemy(60 + col * 60, 50 + row * 40, type));
    }
  }
}

function randomColor() {
  return playerColors[Math.floor(Math.random() * playerColors.length)];
}

function enemyFire() {
  if (gameOver || enemies.length === 0) return;
  enemies.forEach(enemy => {
    if (enemy.canFire()) {
      enemyBullets.push({ x: enemy.x + 10, y: enemy.y + 10 });
      enemy.resetFireCooldown();
    }
  });
}


function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText(`P1: x${player1.lives} (${player1.score})`, 20, 20);
  ctx.fillText(`P2: x${player2.lives} (${player2.score})`, canvas.width - 180, 20);
  ctx.fillText(`Level: ${level}`, canvas.width / 2 - 30, 20);
}

function waitForSprites(callback) {
  const allLoaded = Object.values(enemySprites).every(img => img.complete && img.naturalHeight !== 0);
  if (allLoaded) callback();
  else setTimeout(() => waitForSprites(callback), 100);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showStartScreen) {
    ctx.fillStyle = "white";
    ctx.font = "28px sans-serif";
    ctx.fillText("Tap, press, or move to start", canvas.width / 2 - 180, canvas.height / 2);
 
    ctx.font = "18px sans-serif";
    const quoteWidth = ctx.measureText(`"${quoteText}"`).width;
    ctx.fillText(`"${quoteText}"`, (canvas.width - quoteWidth) / 2, canvas.height / 2 + 40);

    ctx.font = "16px sans-serif";
    const authorWidth = ctx.measureText(`— ${quoteAuthor}`).width;
    ctx.fillText(`— ${quoteAuthor}`, (canvas.width - authorWidth) / 2, canvas.height / 2 + 65);


    requestAnimationFrame(draw);
    return;
   }


  if (paused) {
    ctx.fillStyle = "white";
    ctx.font = "28px sans-serif";
    ctx.fillText("PAUSED", canvas.width / 2 - 60, canvas.height / 2);
    requestAnimationFrame(draw);
    return;
  }

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Score P1: ${player1.score} | P2: ${player2.score}`, canvas.width / 2 - 110, canvas.height / 2 + 20);
	
    ctx.fillText("Press shoot or move to restart", canvas.width / 2 - 150, canvas.height / 2 + 50);
	
	
    requestAnimationFrame(draw);
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

  if (enemies.length === 0 && !gameOver) {
    level++;
    createEnemies();
    updateFireRate();
	
	[player1, player2].forEach(p => {
    if (p.lives < 3) {
      p.lives++;
      if (!p.alive) {
        p.alive = false;
        p.respawnTimer = Date.now();
      }
    }
  });
  
  }

  const activePlayers = [player1, player2].filter(p => p.active);
  if (activePlayers.length > 0 && activePlayers.every(p => !p.alive && p.lives === 0)) {
  gameOver = true;
}

  requestAnimationFrame(draw);
}

function updateEnemyBullets() {
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);
  enemyBullets.forEach(b => {
    b.y += 4;
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x - 2, b.y, 4, 10);
  });
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
function activatePlayer(player) {
  if (showStartScreen) showStartScreen = false;
  if (gameOver) {
    gameOver = false;
    newGame();
  }
  player.active = true;
}


window.addEventListener("keydown", (e) => {
  if (e.key === "a") { player1.moveLeft(); activatePlayer(player1); }
  if (e.key === "d") { player1.moveRight(); activatePlayer(player1); }
  if (e.key === " ") { player1.shoot(); activatePlayer(player1); }
  if (e.key === "ArrowLeft") { player2.moveLeft(); activatePlayer(player2); }
  if (e.key === "ArrowRight") { player2.moveRight(); activatePlayer(player2); }
  if (e.key === "ArrowUp") { player2.shoot(); activatePlayer(player2); }
  if (e.key === "r") newGame();
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const x = e.touches[0].clientX;
  const relX = x - canvas.getBoundingClientRect().left;
  activatePlayer(player1);
  if (relX < canvas.width / 3) player1.x -= player1.speed;
  else if (relX > 2 * canvas.width / 3) player1.x += player1.speed;
  else player1.shoot();
}, { passive: false });



function setupWebSocket() {
  ws = new WebSocket("ws://" + location.hostname + "/ws");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.j1x < 1500) { player1.moveLeft(); activatePlayer(player1); }
    else if (data.j1x > 3500) { player1.moveRight(); activatePlayer(player1); }
    if (data.j1f) { player1.shoot(); activatePlayer(player1); }

    if (data.j2x < 1500) { player2.moveLeft(); activatePlayer(player2); }
    else if (data.j2x > 3500) { player2.moveRight(); activatePlayer(player2); }
    if (data.j2f) { player2.shoot(); activatePlayer(player2); }
  };

  ws.onclose = ws.onerror = () => {
    if (!reconnecting) {
      reconnecting = true;
      setTimeout(() => {
        reconnecting = false;
        reconnectAttempts++;
        setupWebSocket();
      }, Math.min(1000 * reconnectAttempts, 10000));
    }
  };
}

setupWebSocket();

waitForSprites(() => {
  newGame();
  draw();
});