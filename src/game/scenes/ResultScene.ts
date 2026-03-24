import * as THREE from 'three';
import type { Scene, SceneContext, PoopId } from '@/types';
import type { SceneManager } from '@/game/SceneManager';
import type { AudioManager } from '@/game/audio/AudioManager';
import { GAME_SETTINGS } from '@/game/config/GameSettings';
import { POOP_ENCYCLOPEDIA } from '@/game/config/PoopEncyclopedia';
import { calculateScore } from '@/game/systems/ScoreCalculator';
import { PoopModelBuilder } from '@/game/entities/poops/PoopModelBuilder';

export class ResultScene implements Scene {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private overlay: HTMLDivElement | null = null;
  private poopModel: THREE.Group | null = null;
  private poopId: PoopId = 'normal';
  private elapsed = 0;

  constructor(
    private sceneManager: SceneManager,
    private audioManager: AudioManager,
  ) {
    this.camera = new THREE.PerspectiveCamera(
      GAME_SETTINGS.cameraFov,
      window.innerWidth / window.innerHeight,
      0.1, 100,
    );
    this.camera.position.set(0, 2, GAME_SETTINGS.cameraZ);
    this.camera.lookAt(0, 0.5, 0);
  }

  enter(context: SceneContext): void {
    this.elapsed = 0;
    this.poopId = context.poopId ?? 'normal';
    const tapCount = context.tapCount ?? 0;
    const sizeCm = context.sizeCm ?? 0;
    const isNew = context.isNew ?? false;
    const entry = POOP_ENCYCLOPEDIA[this.poopId];
    const scoreBreakdown = calculateScore(tapCount, this.poopId);

    this.scene.background = new THREE.Color(GAME_SETTINGS.bgColor);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(3, 5, 4);
    this.scene.add(ambient, directional);

    // Poop model
    this.poopModel = PoopModelBuilder.build(this.poopId, 2);
    this.poopModel.position.set(0, 0.3, 0);
    this.scene.add(this.poopModel);

    // Floor
    const floorGeo = new THREE.CircleGeometry(3, 32);
    const floorMat = new THREE.MeshToonMaterial({ color: 0x4E342E });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);

    this.buildUI(entry, scoreBreakdown, tapCount, sizeCm, isNew);

    this.audioManager.startBGM('result');
    if (isNew) {
      this.audioManager.playSFX('newDiscovery');
    } else if (entry.rarity >= 4) {
      this.audioManager.playSFX('rare');
    }
    this.audioManager.playSFX('fanfare');
  }

  private buildUI(
    entry: typeof POOP_ENCYCLOPEDIA[PoopId],
    score: { sizePoints: number; rarityBonus: number; total: number },
    tapCount: number,
    sizeCm: number,
    isNew: boolean,
  ): void {
    const uiOverlay = document.getElementById('ui-overlay')!;
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; width: 100%; height: 100%; gap: 0.8rem;
      padding: 1rem;
    `;

    // NEW badge
    if (isNew) {
      const newBadge = document.createElement('div');
      newBadge.textContent = '🎉 NEW!';
      newBadge.style.cssText = `
        font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 900;
        color: #E040FB; text-shadow: 0 0 15px rgba(224,64,251,0.5);
        animation: newPulse 0.8s ease-in-out infinite alternate;
      `;
      this.overlay.appendChild(newBadge);
    }

    // Poop name
    const nameEl = document.createElement('div');
    nameEl.textContent = `${entry.emoji} ${entry.name}`;
    nameEl.style.cssText = `
      font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 900;
      color: #FFD700; text-shadow: 0 3px 6px rgba(0,0,0,0.5);
    `;
    this.overlay.appendChild(nameEl);

    // Rarity stars
    const starsEl = document.createElement('div');
    starsEl.textContent = '★'.repeat(entry.rarity) + '☆'.repeat(5 - entry.rarity);
    starsEl.style.cssText = `
      font-size: clamp(1.2rem, 3vw, 2rem); color: #FFD54F;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    this.overlay.appendChild(starsEl);

    // Score breakdown (occupies right side)
    const scorePanel = document.createElement('div');
    scorePanel.style.cssText = `
      background: rgba(0,0,0,0.4); border-radius: 1rem;
      padding: 1rem 2rem; text-align: center;
      color: #fff; font-weight: 700;
      font-size: clamp(0.8rem, 2vw, 1.1rem);
    `;
    scorePanel.innerHTML = `
      <div style="margin-bottom: 0.5rem; font-size: 1.6em; color: #FFD700;">
        💩 ${sizeCm} cm
      </div>
      <div>れんだ: ${tapCount} かい</div>
      <div>レアど: <span style="color:#E040FB">★${entry.rarity}</span></div>
      <div style="margin-top: 0.5rem; font-size: 1.2em; color: #FFEB3B;">
        スコア: ${score.total} てん
      </div>
    `;
    this.overlay.appendChild(scorePanel);

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap; justify-content: center;';

    const retryBtn = this.createButton('もういっかい', '#FF8F00', '#E65100');
    retryBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('play');
    });

    const encyclopediaBtn = this.createButton('ずかん', '#6D4C41', '#4E342E');
    encyclopediaBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('encyclopedia');
    });

    const rankingBtn = this.createButton('ランキング', '#795548', '#4E342E');
    rankingBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('ranking');
    });

    const homeBtn = this.createButton('タイトルへ', '#5D4037', '#3E2723');
    homeBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('title');
    });

    btnContainer.appendChild(retryBtn);
    btnContainer.appendChild(encyclopediaBtn);
    btnContainer.appendChild(rankingBtn);
    btnContainer.appendChild(homeBtn);
    this.overlay.appendChild(btnContainer);

    // Animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes newPulse {
        from { transform: scale(1); }
        to { transform: scale(1.15); }
      }
    `;
    this.overlay.appendChild(style);

    uiOverlay.appendChild(this.overlay);
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
    if (this.poopModel) {
      this.poopModel.rotation.y = this.elapsed * 0.8;
      this.poopModel.position.y = 0.3 + Math.sin(this.elapsed * 2) * 0.1;
      PoopModelBuilder.animateModel(this.poopModel, this.poopId, this.elapsed);
    }
  }

  exit(): void {
    this.audioManager.stopBGM();
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.poopModel = null;
  }

  getThreeScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }
}
