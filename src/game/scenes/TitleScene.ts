import * as THREE from 'three';
import type { Scene, SceneContext } from '@/types';
import type { SceneManager } from '@/game/SceneManager';
import type { AudioManager } from '@/game/audio/AudioManager';
import { GAME_SETTINGS } from '@/game/config/GameSettings';
import { PoopModelBuilder } from '@/game/entities/poops/PoopModelBuilder';

export class TitleScene implements Scene {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private overlay: HTMLDivElement | null = null;
  private poopModel: THREE.Group | null = null;
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

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.scene.background = new THREE.Color(GAME_SETTINGS.bgColor);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(3, 5, 4);
    this.scene.add(ambient, directional);

    // Demo poop model
    this.poopModel = PoopModelBuilder.build('normal', 1.5);
    this.poopModel.position.set(0, 0.3, 0);
    this.scene.add(this.poopModel);

    // Floor
    const floorGeo = new THREE.CircleGeometry(3, 32);
    const floorMat = new THREE.MeshToonMaterial({ color: 0x4E342E });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);

    this.buildUI();
    this.audioManager.init();
    this.audioManager.startBGM('title');
  }

  private buildUI(): void {
    const uiOverlay = document.getElementById('ui-overlay')!;
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; width: 100%; height: 100%; gap: 1.5rem;
    `;

    // Title
    const title = document.createElement('div');
    title.textContent = '💩 うんちゲーム';
    title.style.cssText = `
      font-size: clamp(2rem, 6vw, 3.5rem); font-weight: 900;
      color: #FFD700; text-shadow: 0 4px 8px rgba(0,0,0,0.6),
      0 0 20px rgba(255,215,0,0.3);
      animation: titleBounce 2s ease-in-out infinite;
    `;
    this.overlay.appendChild(title);

    // Subtitle
    const sub = document.createElement('div');
    sub.textContent = 'ボタンを れんだ して うんちを だそう！';
    sub.style.cssText = `
      font-size: clamp(0.8rem, 2vw, 1.1rem); font-weight: 700;
      color: #FFD54F; text-shadow: 0 2px 4px rgba(0,0,0,0.4);
    `;
    this.overlay.appendChild(sub);

    // Button container
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 1.5rem; margin-top: 1rem; flex-wrap: wrap; justify-content: center;';

    const playBtn = this.createButton('あそぶ', '#FF8F00', '#E65100');
    playBtn.addEventListener('pointerup', () => {
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

    btnContainer.appendChild(playBtn);
    btnContainer.appendChild(encyclopediaBtn);
    btnContainer.appendChild(rankingBtn);
    this.overlay.appendChild(btnContainer);

    // CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes titleBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
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
      border: none; border-radius: 2rem; padding: 1rem 3rem;
      color: #fff; font-family: 'Zen Maru Gothic', sans-serif;
      font-size: clamp(1rem, 2.5vw, 1.3rem); font-weight: 900;
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
      this.poopModel.rotation.y = this.elapsed * 0.5;
      this.poopModel.position.y = 0.3 + Math.sin(this.elapsed * 1.5) * 0.1;
    }
  }

  exit(): void {
    this.audioManager.stopBGM();
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    // Clear scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.poopModel = null;
  }

  getThreeScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }
}
