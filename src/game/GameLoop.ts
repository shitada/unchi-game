export class GameLoop {
  private animationId = 0;
  private lastTime = 0;
  private running = false;
  private paused = false;

  constructor(
    private updateCallback: (deltaTime: number) => void,
    private renderCallback: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    this.animationId = requestAnimationFrame(this.loop);

    if (this.paused) {
      this.lastTime = now;
      return;
    }

    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.updateCallback(deltaTime);
    this.renderCallback();
  };
}
