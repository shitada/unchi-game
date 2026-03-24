import * as THREE from 'three';
import type { Scene, SceneContext, SceneType } from '@/types';

export class SceneManager {
  private scenes = new Map<SceneType, Scene>();
  private currentScene: Scene | null = null;
  private currentType: SceneType | null = null;
  private renderer: THREE.WebGLRenderer;
  private pendingTransition: { type: SceneType; context: SceneContext } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    window.addEventListener('resize', this.onResize);
  }

  registerScene(type: SceneType, scene: Scene): void {
    this.scenes.set(type, scene);
  }

  requestTransition(type: SceneType, context: SceneContext = {}): void {
    this.pendingTransition = { type, context };
  }

  applyPendingTransition(): void {
    if (!this.pendingTransition) return;
    const { type, context } = this.pendingTransition;
    this.pendingTransition = null;
    this.transitionTo(type, context);
  }

  private transitionTo(type: SceneType, context: SceneContext): void {
    if (this.currentScene) {
      this.currentScene.exit();
    }

    const scene = this.scenes.get(type);
    if (!scene) return;

    this.currentScene = scene;
    this.currentType = type;
    scene.enter(context);
  }

  update(deltaTime: number): void {
    this.applyPendingTransition();
    this.currentScene?.update(deltaTime);
  }

  render(): void {
    if (!this.currentScene) return;
    this.renderer.render(
      this.currentScene.getThreeScene(),
      this.currentScene.getCamera(),
    );
  }

  getCurrentType(): SceneType | null {
    return this.currentType;
  }

  private onResize = (): void => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.currentScene) {
      const camera = this.currentScene.getCamera();
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
    }
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
