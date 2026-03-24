import { GameLoop } from '@/game/GameLoop';
import { SceneManager } from '@/game/SceneManager';
import { AudioManager } from '@/game/audio/AudioManager';
import { SaveManager } from '@/game/storage/SaveManager';
import { TitleScene } from '@/game/scenes/TitleScene';
import { PlayScene } from '@/game/scenes/PlayScene';
import { ResultScene } from '@/game/scenes/ResultScene';
import { EncyclopediaScene } from '@/game/scenes/EncyclopediaScene';
import { RankingScene } from '@/game/scenes/RankingScene';

function main() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas not found');

  const audioManager = new AudioManager();
  const saveManager = new SaveManager();
  const sceneManager = new SceneManager(canvas);

  // Register scenes
  sceneManager.registerScene('title', new TitleScene(sceneManager, audioManager));
  sceneManager.registerScene('play', new PlayScene(sceneManager, audioManager, saveManager));
  sceneManager.registerScene('result', new ResultScene(sceneManager, audioManager));
  sceneManager.registerScene('encyclopedia', new EncyclopediaScene(sceneManager, audioManager, saveManager));
  sceneManager.registerScene('ranking', new RankingScene(sceneManager, audioManager, saveManager));

  // Game loop
  const gameLoop = new GameLoop(
    (dt) => sceneManager.update(dt),
    () => sceneManager.render(),
  );

  // Ensure AudioContext is initialized on first user interaction
  const initAudio = () => {
    audioManager.init();
    audioManager.ensureResumed();
    document.removeEventListener('pointerdown', initAudio);
  };
  document.addEventListener('pointerdown', initAudio);

  // Visibility handling
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gameLoop.pause();
      audioManager.stopBGM();
    } else {
      gameLoop.resume();
      audioManager.resumeBGM();
    }
  });

  // Start
  sceneManager.requestTransition('title');
  gameLoop.start();
}

main();
