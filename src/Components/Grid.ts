import { Point } from "../utils/Point";
import { MapData } from "./Map";

export class Tile {
  sourcePos: Point;
  destPos: Point;
  coords: Point;

  constructor() {
    this.sourcePos = new Point(0, 0);
    this.destPos = new Point(0, 0);
    this.coords = new Point(0, 0);
  }
}

export class Grid {
  private tiles: Tile[][] = [[new Tile()]];
  private mapDim: number;
  private origin: Point;
  private destDim: Point = new Point(64, 64);
  private sourceDim: Point = new Point(16, 16);
  private mapData: MapData;

  constructor(mapDim: number, origin: Point, mapData: MapData) {
    this.mapDim = mapDim;
    this.origin = origin;
    this.mapData = mapData;
  }

  // Create empty grid and update with this.tiles
  init() {
    this.tiles = Array.from({ length: this.mapDim }, () => {
      return Array.from({ length: this.mapDim }, () => {
        return new Tile();
      });
    });

    // Once everything is initialized, calculate entire grid
    this.populateGrid();
  }

  // populate grid with source and destination positions
  populateGrid(origin: Point = this.origin) {
    // iterate over each tile
    for (let i = 0; i < this.mapDim; i++) {
      for (let j = 0; j < this.mapDim; j++) {
        // extract tiles from server data
        const tileCoords = this.mapData.tiles[i][j];

        this.tiles[i][j] = {
          // calculate position of tile in sprite
          sourcePos: new Point(
            this.sourceDim.x * tileCoords.x,
            this.sourceDim.y * tileCoords.y
          ),

          // calculate position of tile on screen
          destPos: new Point(
            origin.x - (i - this.mapDim / 2) * this.destDim.x - this.destDim.x,
            origin.y - (j - this.mapDim / 2) * this.destDim.y - this.destDim.y
          ),

          // assign coordinates in game coordinate system tile x tile
          coords: new Point(i, j),
        };
      }
    }
  }

  // returning flattened tiles to avoid nested loops
  getTiles() {
    return this.tiles.flat();
  }

  // called on map.updateOrigin that's called on window.onresize
  updateOrigin(origin: Point) {
    this.populateGrid(origin);
  }

  getSelectedTile() {}
}
