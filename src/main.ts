import { Map } from "./Components/Map";
import { Point } from "./utils/Point";
import { ConnectionManager } from "./Components/ConnectionManager";
import { Player } from "./Components/Player";
import { Tile } from "./Components/Grid";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// ----------------------------- Websockets-----------------------------------
const connectionManager = new ConnectionManager();
connectionManager.listen();
connectionManager.updateServer();
const client_players = connectionManager.client_players; // shady
let this_client_id = ""; // shady
let currentPlayer: Player;

// --------------------------------- JOIN/API ----------------------------------
// consider to handle that also on ws only instead through API

// join button
const joinBtn = document.getElementById("join-button");
joinBtn?.addEventListener("click", async (event) => {
  event.stopPropagation();
  await connectionManager.joinGame();
  this_client_id = connectionManager.this_client_id; // shady
  currentPlayer = client_players[this_client_id]; // shady?
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
  // if move is inside a map and there's a player to control
  if (mouseCoords.x !== -1 && mouseCoords.y !== -1 && currentPlayer) {
    // push this to inputs
    connectionManager.inputs.push({
      timestamp: performance.now(),
      clientId: this_client_id,
      action: "move",
      coords: mouseCoords,
    });

    // immedietally apply to player (prediction)
    currentPlayer.move(mouseCoords);
    console.log(mouseCoords);
  }
});

// ---------------------------Main loop----------------------------------------
// init
const map = new Map(10, origin);
await map.init();

// calculate delta time
let lastFrame = performance.now();

// save last selected tile to see if action is needed to add to input list
let lastSelectedTile: Tile | undefined = new Tile();

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

  // rotate current player if it exists and the selected tile changes
  if (currentPlayer && selectedTile && selectedTile !== lastSelectedTile) {
    const curRotation = currentPlayer.calculateRotation(selectedTile);

    connectionManager.inputs.push({
      timestamp: performance.now(),
      clientId: this_client_id,
      action: "rotate",
      rotation: curRotation,
    });

    currentPlayer.rotate(curRotation);

    lastSelectedTile = selectedTile;
  }
}

mainLoop();
