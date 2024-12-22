import { Map } from "./Components/Map";
import { Point } from "./utils/Point";
import { ConnectionManager } from "./Components/ConnectionManager";
import { Player } from "./Components/Player";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
// ----------------------------- Websockets-----------------------------------

const connectionManager = new ConnectionManager();
connectionManager.listen();
connectionManager.updateServer();
const client_players = connectionManager.client_players;
let this_client_id = "";
let currentPlayer: Player;

// --------------------------------- JOIN/API ----------------------------------
// consider to handle that also on ws only instead through API

// join button
const joinBtn = document.getElementById("join-button");
joinBtn?.addEventListener("click", async (event) => {
  event.stopPropagation();
  await connectionManager.joinGame();
  this_client_id = connectionManager.this_client_id;
  currentPlayer = client_players[this_client_id];
  joinBtn.classList.toggle("hidden");
});

// --------------------------------- Lobby -------------------------------------

// ----------------------------- Updating Canvas ------------------------------
// init
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const origin = new Point(
  Math.floor(window.innerWidth / 2),
  Math.floor(window.innerHeight / 2)
);

// update
function updateCanvas() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  origin.x = Math.floor(window.innerWidth / 2);
  origin.y = Math.floor(window.innerHeight / 2);
  map.updateOrigin(origin);
}
window.onresize = updateCanvas;

// ----------------------------- Handling mouse -------------------------------
// init
let mousePos: Point = new Point(-1, -1);
let mouseCoords: Point = new Point(-1, -1);
// update
addEventListener("mousemove", (event: MouseEvent) => {
  mousePos.x = event.clientX;
  mousePos.y = event.clientY;
  mouseCoords = map.listenMouse(mousePos);
});

addEventListener("click", (event: MouseEvent) => {
  console.log(mouseCoords);
});

// ---------------------------Main loop----------------------------------------
// init
const map = new Map(10, origin);
await map.init();

// calculate delta time
let lastFrame = performance.now();

//update
function mainLoop() {
  window.requestAnimationFrame(mainLoop);
  const curFrame = performance.now();
  const dt = curFrame - lastFrame;
  lastFrame = curFrame;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pixelate everything
  ctx.imageSmoothingEnabled = false;

  // Render map
  map.render(ctx);
  const selectedTile = map.selectedTile;
  if (currentPlayer) {
    map.markTiles(currentPlayer, ctx);
  }

  // Render client_players
  for (let player_client_id in client_players) {
    client_players[player_client_id].render(ctx, map.tileGrid, dt);
  }

  // Control current player
  if (currentPlayer) {
    currentPlayer.control(selectedTile);
  }
}

mainLoop();
