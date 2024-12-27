import { Point } from "../utils/Point";
import { Player } from "./Player";

// --------------------------Server Reconciliation------------------------------

type MoveAction = {
  action: "move";
  coords: Point;
};

type RotateAction = {
  action: "rotate";
  rotation: number;
};

export type Input = (MoveAction | RotateAction) & {
  timestamp: number;
  clientId: string;
};

// --------------------------/Server Reconciliation-----------------------------

interface WebSocketMessage {
  type: string;
  data: any;
}

interface ServerPlayer {
  color: number;
  position: Point;
  rotation: number;
  timestamp: number;
}

interface ServerPlayers {
  readonly [client_id: string]: ServerPlayer;
}

export class ConnectionManager {
  private ws_url = import.meta.env.VITE_WS_URL;
  private ws = new WebSocket(`${this.ws_url}/ws`);
  public this_client_id: string = "";

  public client_players: { [client_id: string]: Player } = {};

  private api_url = import.meta.env.VITE_API_URL;
  private playerName = "zimnoch"; // --------temporary player name--------------

  public inputs: Input[] = [];

  listen() {
    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === "connection") {
          this.this_client_id = message.data;
        }

        if (message.type === "game-tick") {
          const server_players: ServerPlayers = message.data;

          // ADD PLAYERS
          if (
            Object.keys(server_players).length >
            Object.keys(this.client_players).length
          ) {
            // If there are more players on server, check which
            this.addPlayers(server_players);

            // REMOVE PLAYERS
          } else if (
            Object.keys(server_players).length <
            Object.keys(this.client_players).length
          ) {
            // If there are more players on client than on sever, check which
            this.removePlayers(server_players);

            // NORMAL UPDATES
          } else {
            //update each client player with server player data
            this.updateClientPlayers(server_players);
          }

          // console.log(message.data);
          // console.log(Object.keys(message.data).length);
        }
      } catch (error) {
        console.log("Websocket error", error);
      }
    };
  }

  async joinGame() {
    try {
      const timestamp = performance.now();
      // recieve generated player position
      const response = await fetch(
        `${this.api_url}/create_player/${this.playerName}?client_id=${this.this_client_id}&timestamp=${timestamp}`
      );
      const data = await response.json();

      // Check if got player back
      if (data.error) {
        throw Error("Player already exists");
      }
      // create new point from recieved position and create player
      const playerPos = new Point(
        data.player.position.x,
        data.player.position.y
      );
      const curPlayer = new Player(
        this.this_client_id,
        this.playerName,
        playerPos,
        data.player.color
      );
      this.client_players[this.this_client_id] = curPlayer;
    } catch (error) {
      console.log("Couldn't create player", error);
    }
  }

  private addPlayers(server_players: ServerPlayers) {
    for (let server_id in server_players) {
      if (!this.client_players.hasOwnProperty(server_id)) {
        console.log("new player detected", server_players[this.this_client_id]);

        // Create new instance of this player on client
        this.client_players[server_id] = new Player(
          server_id,
          "test",
          server_players[server_id].position,
          server_players[server_id].color
        );
        console.log(
          "current client players: ",
          Object.keys(this.client_players).length
        );
      }
    }
  }

  private removePlayers(server_players: ServerPlayers) {
    for (let client_id in this.client_players) {
      if (!server_players.hasOwnProperty(client_id)) {
        console.log("player disconnected", this.client_players[client_id]);

        // Delete disconnected player from client
        delete this.client_players[client_id];
      }
    }
  }

  // ----------------------------Send/recieve-----------------------------------

  private updateClientPlayers(server_players: ServerPlayers) {
    for (let client_id in this.client_players) {
      // omit current player from loop
      if (client_id === this.this_client_id) continue;

      this.client_players[client_id].rotation =
        server_players[client_id].rotation;

      this.client_players[client_id].move(server_players[client_id].position);
    }

    // SERVER RECONCILIATION
    // move following two lines to this.init()
    const curClientPlayer = this.client_players[this.this_client_id];
    const curServerPlayer = server_players[this.this_client_id];

    // no need to go there since we already update all visible players
    if (!curClientPlayer || !curServerPlayer) return;

    const serverTimestamp = curServerPlayer.timestamp;
    let curInputIndex = -1;

    // find the current timestamp
    const curInput = this.inputs.filter((input: Input, index: number) => {
      if (input.timestamp === serverTimestamp) {
        curInputIndex = index;
        return true;
      }
      return false;
    });

    if (curInput.length === 0) return;
    // validate input at current timestamp
    let valid: boolean = true;

    // depending on last input action, check regarded parameters
    if (curInput[0].action === "move") {
      valid =
        curInput[0].coords.x === curServerPlayer.position.x &&
        curInput[0].coords.y === curServerPlayer.position.y;
    } else if (curInput[0].action === "rotate") {
      valid = curInput[0].rotation === curServerPlayer.rotation;
    }

    // either remove the unnecessary inputs or reapply server's state
    if (valid) {
      this.inputs.splice(0, curInputIndex + 1);
    } else {
      curClientPlayer.reapplyAction({
        rotation: curServerPlayer.rotation,
        position: curServerPlayer.position,
      });
    }
  }

  updateServer() {
    setInterval((): void => {
      const curPlayer = this.client_players[this.this_client_id];

      // No need if there's no input or no curPlayer
      if (curPlayer && this.inputs.length > 0) {
        this.ws.send(
          JSON.stringify({
            type: "game-tick",
            data: this.inputs[0], // send first item to keep order of actions
          })
        );
      }
    }, 15);
  }
}
