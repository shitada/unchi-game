import * as THREE from 'three';
import type { Scene, SceneContext, PoopId } from '@/types';
import type { SceneManager } from '@/game/SceneManager';
import type { AudioManager } from '@/game/audio/AudioManager';
import type { SaveManager } from '@/game/storage/SaveManager';
import { GAME_SETTINGS } from '@/game/config/GameSettings';
import { POOP_ENCYCLOPEDIA, POOP_IDS } from '@/game/config/PoopEncyclopedia';
import { PoopModelBuilder } from '@/game/entities/poops/PoopModelBuilder';
import { FireworkEffect } from '@/game/effects/FireworkEffect';

export class EncyclopediaScene implements Scene {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private overlay: HTMLDivElement | null = null;
  private detailOverlay: HTMLDivElement | null = null;
  private previewModel: THREE.Group | null = null;
  private previewScene = new THREE.Scene();
  private previewCamera: THREE.PerspectiveCamera;
  private previewRenderer: THREE.WebGLRenderer | null = null;
  private previewPoopId: PoopId | null = null;
  private elapsed = 0;
  private fireworks: FireworkEffect | null = null;
  private fireworkTimer = 0;
  private wiggleActive = false;
  private wiggleStart = 0;

  constructor(
    private sceneManager: SceneManager,
    private audioManager: AudioManager,
    private saveManager: SaveManager,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      GAME_SETTINGS.cameraFov,
      window.innerWidth / window.innerHeight,
      0.1, 100,
    );
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    this.previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.previewCamera.position.set(0, 1.5, 4);
    this.previewCamera.lookAt(0, 0.5, 0);
  }

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.wiggleActive = false;
    this.scene.background = new THREE.Color(GAME_SETTINGS.bgColor);

    const discovered = this.saveManager.getDiscoveredPoops();
    const isComplete = discovered.length >= POOP_IDS.length;

    if (isComplete) {
      this.fireworks = new FireworkEffect(this.scene);
      this.fireworkTimer = 0;
      const ambient = new THREE.AmbientLight(0xffffff, 0.3);
      this.scene.add(ambient);
    }

    this.buildUI(discovered);
    this.audioManager.startBGM('title');
  }

  private buildUI(discovered: PoopId[]): void {
    const uiOverlay = document.getElementById('ui-overlay')!;
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      width: 100%; height: 100%; padding: 1rem; gap: 0.8rem;
      overflow-y: auto;
    `;

    // Title
    const title = document.createElement('div');
    title.textContent = '📖 うんちずかん';
    title.style.cssText = `
      font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 900;
      color: #FFD700; text-shadow: 0 3px 6px rgba(0,0,0,0.5);
    `;
    this.overlay.appendChild(title);

    // Progress
    const progress = document.createElement('div');
    progress.textContent = `${discovered.length} / ${POOP_IDS.length} しゅるい はっけん！`;
    progress.style.cssText = `
      font-size: clamp(0.9rem, 2vw, 1.2rem); font-weight: 700;
      color: #FFD54F;
    `;
    this.overlay.appendChild(progress);

    if (discovered.length >= POOP_IDS.length) {
      const complete = document.createElement('div');
      complete.textContent = '🎆 コンプリート！ おめでとう！ 🎆';
      complete.style.cssText = `
        font-size: clamp(1rem, 2.5vw, 1.5rem); font-weight: 900;
        color: #E040FB; text-shadow: 0 0 10px rgba(224,64,251,0.5);
        animation: completePulse 1s ease-in-out infinite alternate;
      `;
      this.overlay.appendChild(complete);
    }

    // Grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid; grid-template-columns: repeat(5, 1fr);
      gap: 0.8rem; width: 100%; max-width: 700px;
      padding: 0.5rem;
    `;

    for (const id of POOP_IDS) {
      const entry = POOP_ENCYCLOPEDIA[id];
      const isFound = discovered.includes(id);
      const card = document.createElement('div');
      card.style.cssText = `
        background: ${isFound ? 'rgba(139,69,19,0.4)' : 'rgba(0,0,0,0.3)'};
        border-radius: 0.8rem; padding: 0.6rem; text-align: center;
        cursor: pointer;
        border: 2px solid ${isFound ? '#8D6E63' : '#555'};
        transition: transform 0.1s;
      `;

      if (isFound) {
        card.innerHTML = `
          <div style="font-size: clamp(1.5rem, 3vw, 2rem);">${entry.emoji}</div>
          <div style="font-size: clamp(0.6rem, 1.2vw, 0.8rem); color: #FFD54F; font-weight: 700; margin-top: 0.3rem;">${entry.name}</div>
          <div style="font-size: clamp(0.5rem, 1vw, 0.7rem); color: #FFD700;">${'★'.repeat(entry.rarity)}</div>
        `;
        card.addEventListener('pointerdown', () => { card.style.transform = 'scale(0.95)'; });
        card.addEventListener('pointerup', () => {
          card.style.transform = 'scale(1)';
          this.showDetail(id);
        });
        card.addEventListener('pointerleave', () => { card.style.transform = 'scale(1)'; });
      } else {
        card.innerHTML = `
          <div style="font-size: clamp(1.5rem, 3vw, 2rem);">❓</div>
          <div style="font-size: clamp(0.6rem, 1.2vw, 0.8rem); color: #888; font-weight: 700; margin-top: 0.3rem;">？？？</div>
          <div style="font-size: clamp(0.5rem, 1vw, 0.7rem); color: #666;">☆☆☆☆☆</div>
        `;
        card.addEventListener('pointerdown', () => { card.style.transform = 'scale(0.95)'; });
        card.addEventListener('pointerup', () => {
          card.style.transform = 'scale(1)';
          this.showHint(id);
        });
        card.addEventListener('pointerleave', () => { card.style.transform = 'scale(1)'; });
      }

      grid.appendChild(card);
    }

    this.overlay.appendChild(grid);

    // Back button
    const backBtn = this.createButton('もどる', '#6D4C41', '#4E342E');
    backBtn.style.marginTop = '0.5rem';
    backBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('title');
    });
    this.overlay.appendChild(backBtn);

    // Animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes completePulse {
        from { transform: scale(1); }
        to { transform: scale(1.05); }
      }
    `;
    this.overlay.appendChild(style);

    uiOverlay.appendChild(this.overlay);
  }

  private showHint(id: PoopId): void {
    const entry = POOP_ENCYCLOPEDIA[id];
    this.audioManager.playSFX('push');

    if (this.detailOverlay) this.detailOverlay.remove();
    this.cleanupPreview();

    const uiOverlay = document.getElementById('ui-overlay')!;
    this.detailOverlay = document.createElement('div');
    this.detailOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 1rem;
      z-index: 30; padding: 1rem;
    `;

    const mysteryEl = document.createElement('div');
    mysteryEl.textContent = '❓';
    mysteryEl.style.cssText = `
      font-size: clamp(3rem, 8vw, 5rem);
      animation: mysteryBounce 1s ease-in-out infinite;
    `;
    this.detailOverlay.appendChild(mysteryEl);

    const labelEl = document.createElement('div');
    labelEl.textContent = 'まだ みつかっていない うんち';
    labelEl.style.cssText = `
      font-size: clamp(1rem, 2.5vw, 1.5rem); font-weight: 900; color: #aaa;
    `;
    this.detailOverlay.appendChild(labelEl);

    const rarityEl = document.createElement('div');
    rarityEl.textContent = 'レアど: ' + '★'.repeat(entry.rarity) + '☆'.repeat(5 - entry.rarity);
    rarityEl.style.cssText = 'font-size: clamp(1rem, 2vw, 1.3rem); color: #FFD54F;';
    this.detailOverlay.appendChild(rarityEl);

    const hintEl = document.createElement('div');
    hintEl.textContent = `💡 ヒント: ${entry.hint}`;
    hintEl.style.cssText = `
      font-size: clamp(0.9rem, 2vw, 1.2rem); color: #FFD54F;
      font-weight: 700; font-style: italic; text-align: center;
      max-width: 400px; background: rgba(255,213,79,0.1);
      border-radius: 0.8rem; padding: 0.8rem 1.2rem;
      border: 1px solid rgba(255,213,79,0.3);
    `;
    this.detailOverlay.appendChild(hintEl);

    const closeBtn = this.createButton('とじる', '#6D4C41', '#4E342E');
    closeBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.closeDetail();
    });
    this.detailOverlay.appendChild(closeBtn);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes mysteryBounce {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-10px) rotate(-5deg); }
        75% { transform: translateY(-5px) rotate(5deg); }
      }
    `;
    this.detailOverlay.appendChild(style);

    uiOverlay.appendChild(this.detailOverlay);
  }

  private showDetail(id: PoopId): void {
    const entry = POOP_ENCYCLOPEDIA[id];
    this.audioManager.playSFX('push');
    this.previewPoopId = id;
    this.wiggleActive = false;

    // Remove previous detail
    if (this.detailOverlay) this.detailOverlay.remove();
    this.cleanupPreview();

    const uiOverlay = document.getElementById('ui-overlay')!;
    this.detailOverlay = document.createElement('div');
    this.detailOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 0.8rem;
      z-index: 30; padding: 1rem;
    `;

    // 3D preview canvas — tap to wiggle
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 300;
    previewCanvas.height = 300;
    previewCanvas.style.cssText = 'border-radius: 1rem; max-width: 40vw; max-height: 30vh; cursor: pointer;';
    previewCanvas.addEventListener('pointerup', () => {
      if (!this.wiggleActive && this.previewPoopId) {
        this.wiggleActive = true;
        this.wiggleStart = this.elapsed;
        this.audioManager.playPoopVoice(this.previewPoopId);
      }
    });
    this.detailOverlay.appendChild(previewCanvas);

    // Tap hint
    const tapHint = document.createElement('div');
    tapHint.textContent = '👆 タップして さわってみよう！';
    tapHint.style.cssText = `
      font-size: clamp(0.6rem, 1.3vw, 0.8rem); color: #aaa; font-weight: 700;
    `;
    this.detailOverlay.appendChild(tapHint);

    // Setup preview renderer
    this.previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, antialias: true, alpha: true });
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.previewRenderer.setSize(300, 300);
    this.previewRenderer.outputColorSpace = THREE.SRGBColorSpace;

    // Setup preview scene
    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x3E2723);
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 4);
    this.previewScene.add(ambient, dir);

    this.previewModel = PoopModelBuilder.build(id, 2);
    this.previewModel.position.set(0, 0.3, 0);
    this.previewModel.userData.baseScale = 2;
    this.previewModel.userData.baseY = 0.3;
    this.previewScene.add(this.previewModel);

    // Name
    const nameEl = document.createElement('div');
    nameEl.textContent = `${entry.emoji} ${entry.name}`;
    nameEl.style.cssText = `
      font-size: clamp(1.3rem, 3vw, 2rem); font-weight: 900;
      color: #FFD700; text-shadow: 0 3px 6px rgba(0,0,0,0.5);
    `;
    this.detailOverlay.appendChild(nameEl);

    // Stars
    const starsEl = document.createElement('div');
    starsEl.textContent = '★'.repeat(entry.rarity) + '☆'.repeat(5 - entry.rarity);
    starsEl.style.cssText = 'font-size: 1.3rem; color: #FFD54F;';
    this.detailOverlay.appendChild(starsEl);

    // Description
    const descEl = document.createElement('div');
    descEl.textContent = entry.description;
    descEl.style.cssText = `
      font-size: clamp(0.8rem, 1.8vw, 1rem); color: #ddd;
      text-align: center; max-width: 500px; font-weight: 700;
    `;
    this.detailOverlay.appendChild(descEl);

    // Hint
    const hintEl = document.createElement('div');
    hintEl.textContent = `💡 だしかた: ${entry.hint}`;
    hintEl.style.cssText = `
      font-size: clamp(0.7rem, 1.5vw, 0.9rem); color: #FFD54F;
      font-weight: 700; font-style: italic;
    `;
    this.detailOverlay.appendChild(hintEl);

    // Close button
    const closeBtn = this.createButton('とじる', '#6D4C41', '#4E342E');
    closeBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.closeDetail();
    });
    this.detailOverlay.appendChild(closeBtn);

    uiOverlay.appendChild(this.detailOverlay);
  }

  private closeDetail(): void {
    this.cleanupPreview();
    this.wiggleActive = false;
    if (this.detailOverlay) {
      this.detailOverlay.remove();
      this.detailOverlay = null;
    }
    this.previewPoopId = null;
  }

  private cleanupPreview(): void {
    if (this.previewRenderer) {
      this.previewRenderer.dispose();
      this.previewRenderer = null;
    }
    this.previewModel = null;
  }

  private createButton(text: string, color1: string, color2: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      background: linear-gradient(135deg, ${color1}, ${color2});
      border: none; border-radius: 2rem; padding: 0.8rem 2rem;
      color: #fff; font-family: 'Zen Maru Gothic', sans-serif;
      font-size: clamp(0.9rem, 2vw, 1.1rem); font-weight: 900;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      cursor: pointer; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.1s;
    `;
    btn.addEventListener('pointerdown', () => { btn.style.transform = 'scale(0.95)'; });
    btn.addEventListener('pointerup', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('pointerleave', () => { btn.style.transform = 'scale(1)'; });
    return btn;
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;

    // Fireworks for complete
    if (this.fireworks) {
      this.fireworkTimer += deltaTime;
      if (this.fireworkTimer > 0.8) {
        this.fireworks.launch();
        this.fireworkTimer = 0;
      }
      this.fireworks.update(deltaTime);
    }

    // Preview model rotation + wiggle
    if (this.previewModel && this.previewRenderer && this.previewPoopId) {
      if (this.wiggleActive) {
        const result = PoopModelBuilder.wiggleModel(this.previewModel, this.previewPoopId, this.elapsed, this.wiggleStart);
        if (!result.active) {
          this.wiggleActive = false;
        }
      } else {
        this.previewModel.rotation.y = this.elapsed * 1.0;
      }
      PoopModelBuilder.animateModel(this.previewModel, this.previewPoopId, this.elapsed);
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }

  exit(): void {
    this.audioManager.stopBGM();
    this.closeDetail();
    this.fireworks?.dispose();
    this.fireworks = null;
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  getThreeScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }
}
