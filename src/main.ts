import { Map } from "./Components/Map";
import { Player } from "./Components/Player";
import { Point } from "./utils/Point";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
// ----------------------------- Websockets---- ------------------------------
const ws_url = import.meta.env.VITE_WS_URL;
const ws = new WebSocket(`${ws_url}/ws`);
let clientId: string = "";

interface WebSocketMessage {
  type: string;
  data: any;
}

// ws connection - get clientId - only to get player for now
ws.onmessage = (event: MessageEvent) => {
  try {
    const message: WebSocketMessage = JSON.parse(event.data);
    if (message.type === "connection") {
      console.log(message.data);
      clientId = message.data;
    }
  } catch (error) {
    console.log("Websocket error", error);
  }
};

// --------------------------------- JOIN/API ----------------------------------
const api_url = import.meta.env.VITE_API_URL;
const players: Player[] = []; // temporary player array
const playerName = "zimnoch"; // temporary player name

// join button
const joinBtn = document.getElementById("join-button");
joinBtn?.addEventListener("click", async (event) => {
  // prevent canvas clicking
  event.stopPropagation();

  // recieve generated player position
  const response = await fetch(
    `${api_url}/create_player/${playerName}?client_id=${clientId}`
  );
  const data = await response.json();

  // create new point from recieved position and create player
  const playerPos = new Point(data.player.position.x, data.player.position.y);
  const curPlayer = new Player(clientId, playerName, playerPos);
  players.push(curPlayer);
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

// spawn player on grid tile

//update
function mainLoop() {
  window.requestAnimationFrame(mainLoop);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pixelate everything
  ctx.imageSmoothingEnabled = false;

  // Render map
  map.render(ctx);

  // Render players
  for (let player of players) {
    player.render(ctx, map.tileGrid);
  }
}

mainLoop();
