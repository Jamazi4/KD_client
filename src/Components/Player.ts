import { Point } from "../utils/Point";
import { Grid, Tile } from "./Grid";

interface PlayerData {
  clientId: string;
  rotation: number;
  position: Point;
}

export class Player {
  // player data
  private clientId: string;
  private name: string;
  private level = 0;
  private position: Point;

  // rendering / animation
  private image = new Image();
  public rotation: number = 0;
  private timer: number = 0;
  private animFrames = [0, 16];
  private curFrame = 0;
  private renderTile: Tile = new Tile();

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

    if (this.timer >= 500) {
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

  control(selectedTile: Tile | undefined) {
    if (selectedTile) this.rotatePlayer(selectedTile, this.renderTile);
  }

  private rotatePlayer(selectedTile: Tile, renderTile: Tile) {
    const dx = selectedTile.coords.x - renderTile.coords.x;
    const dy = selectedTile.coords.y - renderTile.coords.y;

    if (dx == 0 && dy < 0) this.rotation = 0; // down
    if (dx > 0 && dy < 0) this.rotation = 1; // down-left
    if (dx > 0 && dy == 0) this.rotation = 2; // left
    if (dx > 0 && dy > 0) this.rotation = 3; // up-left
    if (dx == 0 && dy > 0) this.rotation = 4; // up
    if (dx < 0 && dy > 0) this.rotation = 5; // up-right
    if (dx < 0 && dy == 0) this.rotation = 6; // right
    if (dx < 0 && dy < 0) this.rotation = 7; // down-right
  }

  getPlayerData(): PlayerData {
    return {
      clientId: this.clientId,
      rotation: this.rotation,
      position: this.position,
    };
  }

  // unused currently
  setPlayerData(data: PlayerData) {
    this.rotation = data.rotation;
  }
}
