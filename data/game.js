const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let shipX = canvas.width / 2;

function drawShip() {
  ctx.fillStyle = "white";
  ctx.fillRect(shipX - 15, canvas.height - 40, 30, 30);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawShip();
}

setInterval(draw, 1000 / 60);

document.addEventListener("keydown", (e) => {
  if (e.key === "a") shipX -= 10;
  if (e.key === "d") shipX += 10;
});
