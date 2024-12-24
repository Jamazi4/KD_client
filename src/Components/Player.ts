import { Point } from "../utils/Point";
import { Grid, Tile } from "./Grid";
import { Input } from "./ConnectionManager";

interface PlayerData {
  clientId?: string;
  rotation?: number;
  position?: Point;
  distance?: number;
}

export class Player {
  // player data
  private clientId: string;
  private name: string;
  private level = 0;
  private position: Point;
  private distance: number = 2; // only for legal tiles dev

  // rendering / animation
  private image = new Image();
  public rotation: number = 0;
  private timer: number = 0;
  private animFrames = [0, 16];
  private curFrame = 0;
  private renderTile: Tile = new Tile();
  private animSpeed = 500;

  constructor(clientId: string, name: string, position: Point, color: number) {
    this.clientId = clientId;
    this.name = name;
    this.position = position;
    this.image.src = `sprites/chars/char-${color}.png`;
  }

  render(ctx: CanvasRenderingContext2D, grid: Grid, dt: number) {
    // Get position data from grid
    this.renderTile = grid.getTile(this.position);

    // set timer to perform animation
    this.timer += dt;

    if (this.timer >= this.animSpeed) {
      this.timer = 0;
      this.curFrame = this.curFrame >= 1 ? 0 : this.curFrame + 1;
    }
    // draw sprite
    ctx.drawImage(
      this.image,
      this.animFrames[this.curFrame], //idle frames (columns)
      this.rotation * 16, // rotate
      16,
      16,
      this.renderTile.destPos.x,
      this.renderTile.destPos.y,
      64,
      64
    );
  }

  rotate(rotation: number) {
    if (rotation !== -1) {
      this.rotation = rotation;
    }
  }

  calculateRotation(selectedTile: Tile): number {
    const dx = selectedTile.coords.x - this.renderTile.coords.x;
    const dy = selectedTile.coords.y - this.renderTile.coords.y;
    let rotation: number = this.rotation;

    if (dx == 0 && dy < 0) rotation = 0; // down
    if (dx > 0 && dy < 0) rotation = 1; // down-left
    if (dx > 0 && dy == 0) rotation = 2; // left
    if (dx > 0 && dy > 0) rotation = 3; // up-left
    if (dx == 0 && dy > 0) rotation = 4; // up
    if (dx < 0 && dy > 0) rotation = 5; // up-right
    if (dx < 0 && dy == 0) rotation = 6; // right
    if (dx < 0 && dy < 0) rotation = 7; // down-right

    return rotation;
  }

  getPlayerData(): PlayerData {
    return {
      clientId: this.clientId,
      rotation: this.rotation,
      position: this.position,
      distance: this.distance,
    };
  }

  move(position: Point) {
    this.position = position;
  }

  reapplyAction(data: PlayerData) {
    this.position = data.position ?? this.position;

    //idk if need to check that
    if (data.rotation != -1) this.rotation = data.rotation ?? this.rotation;
  }
}
