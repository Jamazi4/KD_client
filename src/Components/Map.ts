import { Point } from "../main";

interface MapData {
  tiles: number[][];
}

interface Tile {}

export class Map {
  private image = new Image();
  private mapDim: number;
  private sourceDim: Point = { x: 64, y: 64 };
  private origin: Point;
  private mapData: MapData = { tiles: [[0]] };
  private grid: number[][] = [[0]];

  constructor(mapDim: number, origin: Point) {
    this.origin = origin;
    this.mapDim = mapDim;
    this.image.src = "/map_reduced.png";
  }

  async init() {
    this.image.onload = () => {
      this.createGrid;
    };
    const response = await fetch(
      `http://127.0.0.1:8000/generateMap/${this.mapDim}`
    );
    const data: MapData = await response.json();
    this.mapData = data;
    this.createGrid();
    console.log(this.mapData);
  }

  createGrid() {
    this.grid = Array.from({ length: this.mapDim }, () => {
      return Array.from({ length: this.mapDim }, () => {
        return 0;
      });
    });
    console.log("create-grid", this.grid);
    for (let i = 0; i < this.mapDim; i++) {
      for (let j = 0; j < this.mapDim; j++) {}
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(
      this.image,
      0,
      0,
      16,
      16,
      this.origin.x,
      this.origin.y,
      this.sourceDim.x,
      this.sourceDim.y
    );
  }

  updateOrigin(origin: Point) {
    this.origin = origin;
  }
}
