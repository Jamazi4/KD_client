import { Map } from "./Components/Map";
import { Player } from "./Components/Player";
import { Point } from "./utils/Point";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
// ----------------------------- Websockets-----------------------------------
const ws_url = import.meta.env.VITE_WS_URL;
const ws = new WebSocket(`${ws_url}/ws`);
let this_clinet_id: string = "";

interface WebSocketMessage {
  type: string;
  data: any;
}
const client_players: { [client_id: string]: Player } = {}; // temporary player array
// ----------------------------- Recieve Upades---------------------------------

// ws connection - get this_clinet_id - only to get player for now
ws.onmessage = (event: MessageEvent) => {
  try {
    const message: WebSocketMessage = JSON.parse(event.data);
    if (message.type === "connection") {
      console.log(message.data);
      this_clinet_id = message.data;
    }

    if (message.type === "game-tick") {
      const server_players = message.data;

      // ADD PLAYERS
      if (
        Object.keys(server_players).length > Object.keys(client_players).length
      ) {
        // If there are more players on server, check which
        for (let server_id in server_players) {
          if (!client_players.hasOwnProperty(server_id)) {
            console.log("new player detected", server_players[this_clinet_id]);

            // Create new instance of this player on client
            client_players[server_id] = new Player(
              server_id,
              "test",
              server_players[server_id].position,
              server_players[server_id].color
            );
            console.log(
              "current client players: ",
              Object.keys(client_players).length
            );
          }
        }
        // REMOVE PLAYERS
      } else if (
        Object.keys(server_players).length < Object.keys(client_players).length
      ) {
        // If there are more players on client than on sever, check which
        for (let client_id in client_players) {
          if (!server_players.hasOwnProperty(client_id)) {
            console.log("player disconnected", client_players[client_id]);

            // Delete disconnected player from client
            delete client_players[client_id];
          }
        }
        // NORMAL UPDATES (JUST ROTATION NOW)
      } else {
        //update each client player with server player data
        for (let client_id in client_players) {
          client_players[client_id].rotation =
            server_players[client_id].rotation;
        }
      }

      // console.log(message.data);
      // console.log(Object.keys(message.data).length);
    }
  } catch (error) {
    console.log("Websocket error", error);
  }
};

// -----------------------------Send Upades-------------------------------------

// tick this players updates client->server

setInterval((): void => {
  const curPlayer = client_players[this_clinet_id];
  if (curPlayer) {
    // console.log(curPlayer.getPlayerData());
    ws.send(
      JSON.stringify({
        type: "game-tick",
        data: curPlayer.getPlayerData(),
      })
    );
  }
}, 15);

// --------------------------------- JOIN/API ----------------------------------
// consider to handle that also on ws only instead through API
const api_url = import.meta.env.VITE_API_URL;
const playerName = "zimnoch"; // temporary player name

// join button
const joinBtn = document.getElementById("join-button");
joinBtn?.addEventListener("click", async (event) => {
  // prevent canvas clicking
  event.stopPropagation();

  try {
    // recieve generated player position
    const response = await fetch(
      `${api_url}/create_player/${playerName}?client_id=${this_clinet_id}`
    );
    const data = await response.json();

    // Check if got player back
    if (data.error) {
      throw Error("Player already exists");
    }
    // create new point from recieved position and create player
    const playerPos = new Point(data.player.position.x, data.player.position.y);
    const curPlayer = new Player(
      this_clinet_id,
      playerName,
      playerPos,
      data.player.color
    );
    client_players[this_clinet_id] = curPlayer;

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

  // Render client_players
  for (let player_client_id in client_players) {
    client_players[player_client_id].render(ctx, map.tileGrid, dt);

    // control current player
    if (player_client_id === this_clinet_id) {
      client_players[player_client_id].control(selectedTile);
    }
  }
}

mainLoop();
