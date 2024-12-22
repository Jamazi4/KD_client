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

    if (message.type === "game-tick") {
      // update client_players if another player appears
      // and it doesnt appear in client client_players
      const server_players = message.data;

      // check if we have all players on client
      if (
        Object.keys(server_players).length !==
        Object.keys(client_players).length
      ) {
        // If there are more players on server, check which
        for (let server_id in server_players) {
          if (!client_players.hasOwnProperty(server_id)) {
            console.log("new player detected", server_players[clientId]);

            // Create new instance of this player on client
            client_players[server_id] = new Player(
              server_id,
              "test",
              server_players[server_id][0],
              server_players[server_id][1]
            );
            console.log(
              "current client players: ",
              Object.keys(client_players).length
            );
          }
        }
      }

      // console.log(message.data);
      // console.log(Object.keys(message.data).length);
    }
  } catch (error) {
    console.log("Websocket error", error);
  }
};

// --------------------------------- JOIN/API ----------------------------------
// consider to handle that also on ws only instead through API
const api_url = import.meta.env.VITE_API_URL;
const client_players: { [client_id: string]: Player } = {}; // temporary player array
const playerName = "zimnoch"; // temporary player name

// join button
const joinBtn = document.getElementById("join-button");
joinBtn?.addEventListener("click", async (event) => {
  // prevent canvas clicking
  event.stopPropagation();

  try {
    // recieve generated player position
    const response = await fetch(
      `${api_url}/create_player/${playerName}?client_id=${clientId}`
    );
    const data = await response.json();

    // Check if got player back
    if (data.error) {
      throw Error("Player already exists");
    }
    // create new point from recieved position and create player
    const playerPos = new Point(data.player.position.x, data.player.position.y);
    const curPlayer = new Player(
      clientId,
      playerName,
      playerPos,
      data.player.color
    );
    client_players[clientId] = curPlayer;

    // hide button
    joinBtn.classList.toggle("hidden");
  } catch (error) {
    console.log("Coudln't create player", error);
  }
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

  // Render client_players
  for (let player_client_id in client_players) {
    client_players[player_client_id].render(ctx, map.tileGrid);
  }
}

mainLoop();
