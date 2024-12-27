import { Point } from "../utils/Point";
import { Grid, Tile } from "./Grid";

interface PlayerData {
  clientId?: string;
  rotation?: number;
  position?: Point;
  distance?: number;
}

export class Player {
  // player data
  private readonly clientId: string;
  private readonly name: string;
  private readonly distance: number = 2; // only for legal tiles dev
  private level = 0;
  private position: Point;

  // rendering / animation
  private readonly image = new Image();
  public rotation: number = 0;
  private animTimer: number = 0;
  private readonly animFrames = [0, 16, 32, 48];
  private curFrame = 0;
  private renderTile: Tile = new Tile();
  private destinationCoords: Point = new Point(-1, -1);
  private readonly animSpeed = 500;
  private movingTimer = 5000;
  public moving = false;
  private readonly movingTime = 300;

  constructor(clientId: string, name: string, position: Point, color: number) {
    this.clientId = clientId;
    this.name = name;
    this.position = position;
    this.image.src = `sprites/chars/char-${color}.png`;
  }

  render(ctx: CanvasRenderingContext2D, grid: Grid, dt: number) {
    // set animTimer to perform animation
    this.animTimer += dt;

    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;
      this.curFrame = this.curFrame >= 1 ? 0 : this.curFrame + 1;
    }

    // moving mechanism with animation
    if (this.moving) {
      if (this.movingTimer >= this.movingTime) {
        // moving finished
        this.moving = false;
        this.position = this.destinationCoords;
      } else {
        // currently moving
        this.curFrame = 3;
        const destinationTile = grid.getTile(this.destinationCoords);
        const dx = destinationTile.destPos.x - this.renderTile.destPos.x;
        const dy = destinationTile.destPos.y - this.renderTile.destPos.y;
        this.renderTile.destPos.x += dx / dt;
        this.renderTile.destPos.y += dy / dt;
        this.movingTimer += dt;
      }
    } else {
      // Get position data from grid
      this.renderTile = grid.getTile(this.position);
    }

    // draw sprite
    ctx.drawImage(
      this.image,
      this.animFrames[this.curFrame], //idle frames (columns)
      this.rotation * 16, // rotate (rows)
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

  calculateAttackCoords(): Point {
    let attackCoords;
    switch (this.rotation) {
      case 0: // down
        attackCoords = new Point(
          this.renderTile.coords.x,
          this.renderTile.coords.y - 1
        );
        break;
      case 1: // down-left
        attackCoords = new Point(
          this.renderTile.coords.x + 1,
          this.renderTile.coords.y - 1
        );
        break;
      case 2: // left
        attackCoords = new Point(
          this.renderTile.coords.x + 1,
          this.renderTile.coords.y
        );
        break;
      case 3: // up-left
        attackCoords = new Point(
          this.renderTile.coords.x + 1,
          this.renderTile.coords.y + 1
        );
        break;
      case 4: // up
        attackCoords = new Point(
          this.renderTile.coords.x,
          this.renderTile.coords.y + 1
        );
        break;
      case 5: // up-right
        attackCoords = new Point(
          this.renderTile.coords.x - 1,
          this.renderTile.coords.y + 1
        );
        break;
      case 6:
        attackCoords = new Point(
          this.renderTile.coords.x - 1,
          this.renderTile.coords.y
        );
        break;
      case 7:
        attackCoords = new Point(
          this.renderTile.coords.x - 1,
          this.renderTile.coords.y - 1
        );
        break;
    }
    if (attackCoords) return attackCoords;
    return new Point(-1, -1);
  }

  calculateLegalCoords(): Point[] {
    let legalCoords: Point[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        legalCoords.push(
          new Point(this.position.x + 2 - i, this.position.y + 2 - j)
        );
      }
    }
    return legalCoords;
  }

  getPlayerData(): PlayerData {
    return {
      clientId: this.clientId ?? "",
      rotation: this.rotation ?? -1,
      position: this.position ?? new Point(-1, -1),
    };
  }

  move(position: Point) {
    this.movingTimer = 0;
    this.moving = true;
    this.destinationCoords = position;
    setTimeout(() => {
      this.position = position;
    }, 300);
  }

  reapplyAction(data: PlayerData) {
    this.position = data.position ?? this.position;

    //idk if need to check that
    if (data.rotation != -1) this.rotation = data.rotation ?? this.rotation;
  }
}
