import { Point } from "../utils/Point";
import { Grid, Tile } from "./Grid";
import { Player } from "./Player";

export interface MapData {
  tiles: Point[][];
}

export class Map {
  // rendering
  private mapImage = new Image();
  private markerImage = new Image();
  private mapDim: number;
  private origin: Point;
  private mapData: MapData = { tiles: [[new Point(0, 0)]] };
  private server_url = import.meta.env.VITE_API_URL;

  // grid
  public tileGrid: Grid;

  // input handling
  private mouseCoords: Point;
  public selectedTile: Tile | undefined;

  constructor(mapDim: number, origin: Point) {
    this.origin = origin;
    this.mapDim = mapDim;
    this.mapImage.src = "sprites/map/map_reduced.png";
    this.markerImage.src = "sprites/map/function_map_tiles.png";
    this.tileGrid = new Grid(this.mapDim, this.origin, this.mapData);

    this.mouseCoords = new Point(-1, -1);
  }

  // load mapImage and fetch data from server
  async init() {
    try {
      const response = await fetch(
        `${this.server_url}/generateMap/${this.mapDim}`
      );
      const data: MapData = await response.json();
      this.mapData = data;

      this.createGrid();
    } catch (error) {
      console.log("Map init failed", error);
    }
  }

  // New grid with
  private createGrid() {
    this.tileGrid = new Grid(this.mapDim, this.origin, this.mapData);
    this.tileGrid.init();
  }

  // draw mapImage on canvas relative to origin / return curtile if any selected
  render(ctx: CanvasRenderingContext2D) {
    // extract drawing data from grid where it's calculated
    const tiles = this.tileGrid.getTiles();

    // iterate over flattened tile array and draw each tile
    for (let curTile of tiles) {
      ctx.drawImage(
        this.mapImage,
        curTile.sourcePos.x,
        curTile.sourcePos.y,
        16,
        16,
        curTile.destPos.x,
        curTile.destPos.y,
        64,
        64
      );

      // draw selection marker
      if (curTile.coords.equals(this.mouseCoords)) {
        ctx.drawImage(
          this.markerImage,
          0,
          48, // sprite coordinates for highlight marker
          16,
          16,
          curTile.destPos.x,
          curTile.destPos.y,
          64,
          64
        );

        // save selected tile
        this.selectedTile = curTile;
      }
      ctx.font = "12px arial";
    }
    // Debuggin coords
  }

  // called on window.onresize
  updateOrigin(origin: Point) {
    this.origin = origin;
    this.tileGrid.updateOrigin(origin);
  }

  listenMouse(mousePos: Point): Point {
    // convert view coords to grid coords
    const curX = Math.floor(
      (this.origin.x + (this.mapDim / 2) * 64 - mousePos.x) / 64
    );

    const curY = Math.floor(
      (this.origin.y + (this.mapDim / 2) * 64 - mousePos.y) / 64
    );

    // if pointing inside map, update mousecoords
    if (
      curY <= this.mapDim - 1 &&
      curX <= this.mapDim - 1 &&
      curY >= 0 &&
      curX >= 0
    ) {
      this.mouseCoords = new Point(curX, curY);
    } else {
      // by setting -1, -1 point - deselect any tile
      this.mouseCoords = new Point(-1, -1);
    }
    return this.mouseCoords;
  }

  private markAttackTile(player: Player, ctx: CanvasRenderingContext2D) {
    const { position, rotation } = player.getPlayerData();

    if (!position) return;
    const playerTile = this.tileGrid.getTile(position);
    let markPos;

    switch (rotation) {
      case 0: // down
        markPos = new Point(playerTile.coords.x, playerTile.coords.y - 1);
        break;
      case 1: // down-left
        markPos = new Point(playerTile.coords.x + 1, playerTile.coords.y - 1);
        break;
      case 2: // left
        markPos = new Point(playerTile.coords.x + 1, playerTile.coords.y);
        break;
      case 3: // up-left
        markPos = new Point(playerTile.coords.x + 1, playerTile.coords.y + 1);
        break;
      case 4: // up
        markPos = new Point(playerTile.coords.x, playerTile.coords.y + 1);
        break;
      case 5: // up-right
        markPos = new Point(playerTile.coords.x - 1, playerTile.coords.y + 1);
        break;
      case 6:
        markPos = new Point(playerTile.coords.x - 1, playerTile.coords.y);
        break;
      case 7:
        markPos = new Point(playerTile.coords.x - 1, playerTile.coords.y - 1);
        break;
    }

    // Check if markPos is not out of map bounds i.e.
    // player at bottom tile looking down
    const validMarkPos =
      markPos &&
      markPos.x >= 0 &&
      markPos.y >= 0 &&
      markPos.x < this.mapDim &&
      markPos.y < this.mapDim;

    if (markPos && validMarkPos) {
      const tileToMark = this.tileGrid.getTile(markPos);

      ctx.drawImage(
        this.markerImage,
        0,
        0, // sprite coordinates for highlight marker
        16,
        16,
        tileToMark.destPos.x,
        tileToMark.destPos.y,
        64,
        64
      );
    }
  }

  private markLegalTiles(player: Player, ctx: CanvasRenderingContext2D) {}

  markTiles(player: Player, ctx: CanvasRenderingContext2D) {
    this.markAttackTile(player, ctx);
  }
}
