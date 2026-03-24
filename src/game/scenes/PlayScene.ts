import * as THREE from 'three';
import type { Scene, SceneContext } from '@/types';
import type { SceneManager } from '@/game/SceneManager';
import type { AudioManager } from '@/game/audio/AudioManager';
import type { SaveManager } from '@/game/storage/SaveManager';
import { GAME_SETTINGS } from '@/game/config/GameSettings';
import { InputAnalyzer } from '@/game/systems/InputAnalyzer';
import { determinePoopType } from '@/game/entities/poops/PoopFactory';
import { calculateScore, calculateSizeCm } from '@/game/systems/ScoreCalculator';
import { PoopModelBuilder } from '@/game/entities/poops/PoopModelBuilder';
import { PoopGrowEffect } from '@/game/effects/PoopGrowEffect';

export class PlayScene implements Scene {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private overlay: HTMLDivElement | null = null;
  private inputAnalyzer = new InputAnalyzer();
  private timer: number = GAME_SETTINGS.gameDuration;
  private gameActive = false;
  private elapsed = 0;
  private poopModel: THREE.Group | null = null;
  private growEffect: PoopGrowEffect | null = null;
  private timerEl: HTMLDivElement | null = null;
  private counterEl: HTMLDivElement | null = null;
  private shakeOffset = 0;
  private currentScale = 0.3;
  private bonusTextEls: { el: HTMLDivElement; birth: number }[] = [];
  private flashEl: HTMLDivElement | null = null;

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
    this.camera.position.set(0, 2.5, GAME_SETTINGS.cameraZ);
    this.camera.lookAt(0, 0.5, 0);
  }

  enter(_context: SceneContext): void {
    this.elapsed = 0;
    this.timer = GAME_SETTINGS.gameDuration;
    this.gameActive = true;
    this.inputAnalyzer.reset();
    this.currentScale = 0.3;
    this.shakeOffset = 0;

    this.scene.background = new THREE.Color(GAME_SETTINGS.bgColor);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(3, 5, 4);
    this.scene.add(ambient, directional);

    // Floor
    const floorGeo = new THREE.CircleGeometry(3, 32);
    const floorMat = new THREE.MeshToonMaterial({ color: 0x4E342E });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);

    // Initial small poop (will grow)
    this.poopModel = PoopModelBuilder.build('normal', this.currentScale);
    this.poopModel.position.set(0, 0, 0);
    this.scene.add(this.poopModel);

    // Particle effect
    this.growEffect = new PoopGrowEffect(this.scene);

    this.buildUI();
    this.audioManager.startBGM('play');
  }

  private buildUI(): void {
    const uiOverlay = document.getElementById('ui-overlay')!;
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      justify-content: space-between; width: 100%; height: 100%;
      padding: 1.5rem;
    `;

    // Top bar: timer + counter
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      display: flex; justify-content: space-between; width: 100%;
      align-items: center;
    `;

    this.timerEl = document.createElement('div');
    this.timerEl.style.cssText = `
      font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 900;
      color: #FFEB3B; text-shadow: 0 3px 6px rgba(0,0,0,0.5);
    `;
    this.updateTimerDisplay();

    this.counterEl = document.createElement('div');
    this.counterEl.style.cssText = `
      font-size: clamp(1.2rem, 3vw, 2rem); font-weight: 900;
      color: #FFD54F; text-shadow: 0 3px 6px rgba(0,0,0,0.5);
    `;
    this.updateCounterDisplay();

    topBar.appendChild(this.timerEl);
    topBar.appendChild(this.counterEl);
    this.overlay.appendChild(topBar);

    // Spacer
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    this.overlay.appendChild(spacer);

    // Push button
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'padding-bottom: 2rem;';

    const pushBtn = document.createElement('button');
    pushBtn.textContent = '💩 ふんばる！';
    pushBtn.style.cssText = `
      background: linear-gradient(135deg, #FF8F00, #E65100);
      border: none; border-radius: 50%;
      width: clamp(120px, 20vw, 180px); height: clamp(120px, 20vw, 180px);
      color: #fff; font-family: 'Zen Maru Gothic', sans-serif;
      font-size: clamp(1rem, 2.5vw, 1.5rem); font-weight: 900;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
      cursor: pointer; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.05s;
    `;

    pushBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!this.gameActive) return;
      pushBtn.style.transform = 'scale(0.9)';
      this.inputAnalyzer.recordPointerDown();
      this.onPush();
    });
    pushBtn.addEventListener('pointerup', () => {
      pushBtn.style.transform = 'scale(1)';
      this.inputAnalyzer.recordPointerUp();
    });
    pushBtn.addEventListener('pointerleave', () => {
      pushBtn.style.transform = 'scale(1)';
      this.inputAnalyzer.recordPointerUp();
    });

    btnContainer.appendChild(pushBtn);
    this.overlay.appendChild(btnContainer);

    uiOverlay.appendChild(this.overlay);
  }

  private onPush(): void {
    this.inputAnalyzer.recordTap();
    this.audioManager.playSFX('push');

    // Grow the poop
    const tapCount = this.inputAnalyzer.getTapCount();
    this.currentScale = 0.3 + Math.min(tapCount, 100) * 0.012;
    if (this.poopModel) {
      this.poopModel.scale.setScalar(this.currentScale);
    }

    // Screen shake
    this.shakeOffset = 0.15;

    // Particle at poop top
    if (this.growEffect && this.poopModel) {
      const topY = this.poopModel.position.y + this.currentScale;
      this.growEffect.emit(new THREE.Vector3(0, topY, 0));
    }

    this.updateCounterDisplay();

    // Check for real-time bonuses
    const newBonuses = this.inputAnalyzer.checkNewBonuses();
    for (const bonus of newBonuses) {
      this.showBonusEffect(bonus.label);
    }
  }

  private showBonusEffect(label: string): void {
    this.audioManager.playSFX('bonus');

    // Flash overlay
    if (this.overlay) {
      if (!this.flashEl) {
        this.flashEl = document.createElement('div');
        this.flashEl.style.cssText = `
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 5;
        `;
        this.overlay.appendChild(this.flashEl);
      }
      this.flashEl.style.background = 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)';
      this.flashEl.style.opacity = '1';
      setTimeout(() => {
        if (this.flashEl) this.flashEl.style.opacity = '0';
      }, 300);
    }

    // Floating text
    if (this.overlay) {
      const textEl = document.createElement('div');
      textEl.textContent = label;
      textEl.style.cssText = `
        position: absolute; left: 50%; top: 35%;
        transform: translateX(-50%);
        font-size: clamp(1.2rem, 3.5vw, 2rem); font-weight: 900;
        color: #FFD700; text-shadow: 0 0 15px rgba(255,215,0,0.8), 0 3px 6px rgba(0,0,0,0.6);
        pointer-events: none; z-index: 15;
        white-space: nowrap;
        transition: all 1.2s ease-out;
        opacity: 1;
      `;
      this.overlay.appendChild(textEl);
      this.bonusTextEls.push({ el: textEl, birth: this.elapsed });

      // Animate: float up & fade
      requestAnimationFrame(() => {
        textEl.style.top = '15%';
        textEl.style.opacity = '0';
        textEl.style.transform = 'translateX(-50%) scale(1.3)';
      });

      // Remove after animation
      setTimeout(() => {
        textEl.remove();
        this.bonusTextEls = this.bonusTextEls.filter(b => b.el !== textEl);
      }, 1300);
    }

    // Extra big screen shake
    this.shakeOffset = 0.35;
  }

  private updateTimerDisplay(): void {
    if (this.timerEl) {
      const secs = Math.ceil(this.timer);
      this.timerEl.textContent = `⏱️ ${secs}`;
      if (secs <= 3) {
        this.timerEl.style.color = '#FF5252';
        this.timerEl.style.transform = `scale(${1 + (3 - secs) * 0.1})`;
      }
    }
  }

  private updateCounterDisplay(): void {
    if (this.counterEl) {
      this.counterEl.textContent = `${this.inputAnalyzer.getTapCount()} かい`;
    }
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;

    if (this.gameActive) {
      this.timer -= deltaTime;
      this.updateTimerDisplay();

      // BGM speed: stay at 0.85x for first 2s, then accelerate from remaining 8s → 0s (0.85x → 2.0x)
      const accelThreshold = GAME_SETTINGS.gameDuration - 2; // start accelerating at 8s remaining
      if (this.timer >= accelThreshold) {
        this.audioManager.setBGMSpeed(0.85);
      } else {
        const ratio = this.timer / accelThreshold; // 1.0 at 8s, 0.0 at 0s
        const bgmSpeed = 0.85 + (1 - ratio) * 1.15; // 0.85 → 2.0
        this.audioManager.setBGMSpeed(bgmSpeed);
      }

      if (this.timer <= 0) {
        this.timer = 0;
        this.gameActive = false;
        this.onGameEnd();
      }
    }

    // Poop wobble
    if (this.poopModel) {
      this.poopModel.rotation.y = Math.sin(this.elapsed * 2) * 0.15;
    }

    // Screen shake decay
    if (this.shakeOffset > 0) {
      this.camera.position.x = Math.sin(this.elapsed * 50) * this.shakeOffset;
      this.shakeOffset *= 0.9;
      if (this.shakeOffset < 0.001) {
        this.shakeOffset = 0;
        this.camera.position.x = 0;
      }
    }

    // Particles
    this.growEffect?.update(deltaTime);
  }

  private onGameEnd(): void {
    this.audioManager.playSFX('finish');

    const analysis = this.inputAnalyzer.analyze();
    const poopId = determinePoopType(analysis);
    const score = calculateScore(analysis.tapCount, poopId);
    const sizeResult = calculateSizeCm(analysis);
    const isNew = this.saveManager.recordPlay(poopId, score.total);
    this.saveManager.recordRanking(sizeResult.totalCm, poopId, analysis.tapCount);

    // Delay transition for finish sound
    setTimeout(() => {
      this.sceneManager.requestTransition('result', {
        poopId,
        tapCount: analysis.tapCount,
        score: score.total,
        sizeCm: sizeResult.totalCm,
        isNew,
      });
    }, 800);
  }

  exit(): void {
    this.audioManager.stopBGM();
    this.growEffect?.dispose();
    this.growEffect = null;
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    this.timerEl = null;
    this.counterEl = null;
    this.flashEl = null;
    this.bonusTextEls = [];
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.poopModel = null;
  }

  getThreeScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }
}
