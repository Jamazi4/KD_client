import { Point } from "../utils/Point";
import { Grid } from "./Grid";

export class Player {
  private clientId: string;
  private name: string;
  private level = 0;
  private position: Point;
  private image = new Image();
  private rotation: number = 0;

  constructor(clientId: string, name: string, position: Point, color: number) {
    this.clientId = clientId;
    this.name = name;
    this.position = position;
    this.image.src = `sprites/chars/char-${color}.png`;
  }

  render(ctx: CanvasRenderingContext2D, grid: Grid) {
    const renderTile = grid.getTile(this.position);
    // console.log(renderTile);
    ctx.drawImage(
      this.image,
      0,
      0,
      16,
      16,
      renderTile.destPos.x,
      renderTile.destPos.y,
      64,
      64
    );
  }
}
