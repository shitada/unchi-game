import * as THREE from 'three';
import type { Scene, SceneContext, PoopId } from '@/types';
import type { SceneManager } from '@/game/SceneManager';
import type { AudioManager } from '@/game/audio/AudioManager';
import type { SaveManager } from '@/game/storage/SaveManager';
import { GAME_SETTINGS } from '@/game/config/GameSettings';
import { POOP_ENCYCLOPEDIA } from '@/game/config/PoopEncyclopedia';
import { PoopModelBuilder } from '@/game/entities/poops/PoopModelBuilder';

export class RankingScene implements Scene {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private overlay: HTMLDivElement | null = null;
  private poopModel: THREE.Group | null = null;
  private displayPoopId: PoopId | null = null;
  private elapsed = 0;

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

    // Floor
    const floorGeo = new THREE.CircleGeometry(3, 32);
    const floorMat = new THREE.MeshToonMaterial({ color: 0x4E342E });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);

    const ranking = this.saveManager.getRanking();

    // Show #1 poop in 3D if exists
    if (ranking.length > 0) {
      this.displayPoopId = ranking[0].poopId;
      this.poopModel = PoopModelBuilder.build(this.displayPoopId, 2);
      this.poopModel.position.set(0, 0.3, 0);
      this.scene.add(this.poopModel);
    }

    this.buildUI(ranking);
    this.audioManager.startBGM('title');
  }

  private buildUI(ranking: ReturnType<SaveManager['getRanking']>): void {
    const uiOverlay = document.getElementById('ui-overlay')!;
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      width: 100%; height: 100%; padding: 1rem; gap: 0.6rem;
      overflow-y: auto;
    `;

    // Title
    const title = document.createElement('div');
    title.textContent = '🏆 ランキング';
    title.style.cssText = `
      font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 900;
      color: #FFD700; text-shadow: 0 3px 6px rgba(0,0,0,0.5);
    `;
    this.overlay.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.textContent = 'うんちの おおきさ TOP5';
    subtitle.style.cssText = `
      font-size: clamp(0.8rem, 2vw, 1.1rem); font-weight: 700;
      color: #FFD54F;
    `;
    this.overlay.appendChild(subtitle);

    if (ranking.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'まだ きろく が ないよ！\nあそんで うんちを だそう！';
      empty.style.cssText = `
        font-size: clamp(1rem, 2.5vw, 1.3rem); font-weight: 700;
        color: #aaa; text-align: center; margin-top: 2rem;
        white-space: pre-line;
      `;
      this.overlay.appendChild(empty);
    } else {
      // Ranking list
      const list = document.createElement('div');
      list.style.cssText = `
        width: 100%; max-width: 550px; display: flex;
        flex-direction: column; gap: 0.5rem;
      `;

      const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#8D6E63', '#6D4C41'];
      const medalEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

      ranking.forEach((entry, i) => {
        const poopEntry = POOP_ENCYCLOPEDIA[entry.poopId];
        const row = document.createElement('div');
        const isFirst = i === 0;
        row.style.cssText = `
          display: flex; align-items: center; gap: 0.8rem;
          background: ${isFirst ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.3)'};
          border: 2px solid ${medalColors[i] ?? '#555'};
          border-radius: 1rem; padding: 0.6rem 1rem;
          cursor: pointer; transition: transform 0.1s;
        `;

        // Tap to show this poop in 3D
        row.addEventListener('pointerdown', () => { row.style.transform = 'scale(0.97)'; });
        row.addEventListener('pointerup', () => {
          row.style.transform = 'scale(1)';
          this.showPoopModel(entry.poopId);
        });
        row.addEventListener('pointerleave', () => { row.style.transform = 'scale(1)'; });

        // Rank medal
        const rankEl = document.createElement('div');
        rankEl.textContent = medalEmojis[i];
        rankEl.style.cssText = `
          font-size: clamp(1.3rem, 3vw, 2rem); flex-shrink: 0;
        `;

        // Poop emoji
        const emojiEl = document.createElement('div');
        emojiEl.textContent = poopEntry.emoji;
        emojiEl.style.cssText = `
          font-size: clamp(1.5rem, 3vw, 2rem); flex-shrink: 0;
        `;

        // Info
        const infoEl = document.createElement('div');
        infoEl.style.cssText = 'flex: 1; min-width: 0;';

        const nameRow = document.createElement('div');
        nameRow.style.cssText = `
          font-size: clamp(0.7rem, 1.5vw, 0.9rem); font-weight: 700;
          color: #FFD54F; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap;
        `;
        nameRow.textContent = poopEntry.name;

        const dateRow = document.createElement('div');
        dateRow.style.cssText = `
          font-size: clamp(0.5rem, 1vw, 0.7rem); color: #999;
          font-weight: 700;
        `;
        const d = new Date(entry.playedAt);
        dateRow.textContent = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

        infoEl.appendChild(nameRow);
        infoEl.appendChild(dateRow);

        // Size
        const sizeEl = document.createElement('div');
        sizeEl.style.cssText = `
          font-size: clamp(1rem, 2.5vw, 1.5rem); font-weight: 900;
          color: ${isFirst ? '#FFD700' : '#FFEB3B'}; flex-shrink: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        sizeEl.textContent = `${entry.sizeCm} cm`;

        row.appendChild(rankEl);
        row.appendChild(emojiEl);
        row.appendChild(infoEl);
        row.appendChild(sizeEl);
        list.appendChild(row);
      });

      this.overlay.appendChild(list);
    }

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap; justify-content: center;';

    const playBtn = this.createButton('あそぶ', '#FF8F00', '#E65100');
    playBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('play');
    });

    const homeBtn = this.createButton('もどる', '#6D4C41', '#4E342E');
    homeBtn.addEventListener('pointerup', () => {
      this.audioManager.playSFX('push');
      this.sceneManager.requestTransition('title');
    });

    btnContainer.appendChild(playBtn);
    btnContainer.appendChild(homeBtn);
    this.overlay.appendChild(btnContainer);

    uiOverlay.appendChild(this.overlay);
  }

  private showPoopModel(poopId: PoopId): void {
    // Replace 3D model
    if (this.poopModel) {
      this.scene.remove(this.poopModel);
    }
    this.displayPoopId = poopId;
    this.poopModel = PoopModelBuilder.build(poopId, 2);
    this.poopModel.position.set(0, 0.3, 0);
    this.scene.add(this.poopModel);
    this.audioManager.playPoopVoice(poopId);
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
    if (this.poopModel && this.displayPoopId) {
      this.poopModel.rotation.y = this.elapsed * 0.6;
      this.poopModel.position.y = 0.3 + Math.sin(this.elapsed * 1.5) * 0.1;
      PoopModelBuilder.animateModel(this.poopModel, this.displayPoopId, this.elapsed);
    }
  }

  exit(): void {
    this.audioManager.stopBGM();
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.poopModel = null;
    this.displayPoopId = null;
  }

  getThreeScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }
}
