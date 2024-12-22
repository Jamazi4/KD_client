import { Point } from "../utils/Point";
import { Grid, Tile } from "./Grid";

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
  async createGrid() {
    this.tileGrid = new Grid(this.mapDim, this.origin, this.mapData);
    this.tileGrid.init();
  }

  // draw mapImage on canvas relative to origin
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
      }

      ctx.font = "12px arial";
    }
    // Debuggin coords
    // for (let tile in tiles) {
    //   ctx.fillText(
    //     `${tiles[tile].coords.x} x ${tiles[tile].coords.y}`,
    //     tiles[tile].destPos.x + 32 - 10,
    //     tiles[tile].destPos.y + 32
    //   );
    // }
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

  // console.log(this.mouseCoords);
}
