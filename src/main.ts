import { Map } from "./Components/Map";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

export interface Point {
  x: number;
  y: number;
}

// ----------------------------- Updating Origin ------------------------------
const origin = { x: canvas.width / 2, y: canvas.height / 2 };
function updateOrigin() {
  origin.x = window.innerWidth / 2;
  origin.y = window.innerHeight / 2;
  map.updateOrigin(origin);
}
window.onresize = updateOrigin;
// ----------------------------------------------------------------------------

const map = new Map(10, origin);
map.init();

//Main loop
function mainLoop() {
  window.requestAnimationFrame(mainLoop);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pixelate everything
  ctx.imageSmoothingEnabled = false;

  map.render(ctx);
  // ctx.drawImage(map.);
}

mainLoop();
