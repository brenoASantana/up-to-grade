import Phaser from "phaser";
import "./retro-theme.css";
import "./style.css";

let playerName: string = "";

class GameScene extends Phaser.Scene {
  private score: number = 0;
  private level: number = 1;
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super("GameScene");
  }

  preload() {
    // Aqui você carregará sua trilha sonora e artes
    this.load.audio("trilha_base", "assets/audio/base_beat.mp3");
  }

  create() {
    if (this.cache.audio.exists("trilha_base")) {
      this.bgMusic = this.sound.add("trilha_base", { loop: true, volume: 0.2 });
      this.bgMusic.play();
    }

    // Saudação personalizada
    this.add.text(100, 50, `Bem-vindo(a), ${playerName}!`, {
      fontSize: "32px",
      color: "#FFD700",
    });

    const scoreText = this.add.text(100, 100, "Habilidade: 0", {
      fontSize: "32px",
    });

    // Botão de upgrade
    this.add
      .text(100, 200, "[ Treinar Habilidade ]", { color: "#0f0" })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.score += 10;
        scoreText.setText(`Habilidade: ${this.score}`);
        this.checkUpgrade();
        // Salva progresso no backend (se disponível)
        saveGameToBackend(this.score, this.level, playerName).catch(() => {});
      });
  }

  checkUpgrade() {
    // Aumenta o volume da música conforme você fica "forte"
    if (this.score > 100 && this.level === 1) {
      this.level = 2;
      if (this.bgMusic) {
        this.tweens.add({ targets: this.bgMusic, volume: 0.6, duration: 2000 });
      }
      console.log("Sua percepção musical aumentou!");
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  parent: "game-container",
};

// Função para iniciar o jogo
function startGame(name: string) {
  playerName = name;
  const welcomeScreen = document.getElementById("welcome-screen");
  const gameContainer = document.getElementById("game-container");

  // Efeito sonoro de início (se disponível)
  playStartSound();

  // Animação de fade out
  if (welcomeScreen) {
    welcomeScreen.classList.add("fade-out");

    setTimeout(() => {
      welcomeScreen.style.display = "none";
      if (gameContainer) {
        gameContainer.style.display = "block";
        gameContainer.classList.add("fade-in");
      }
      // Inicia o jogo
      new Phaser.Game(config);
    }, 800);
  }
}

// Função para tocar som de início
function playStartSound() {
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = "square";
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

  // Melodia 8-bit de início
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    oscillator.frequency.setValueAtTime(
      freq,
      audioContext.currentTime + i * 0.15,
    );
  });

  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Configura a tela de boas-vindas
const setupWelcomeScreen = () => {
  const welcomeScreen = document.getElementById("welcome-screen");
  const nameInput = document.getElementById("player-name") as HTMLInputElement;
  const startButton = document.getElementById(
    "start-button",
  ) as HTMLButtonElement;

  if (startButton && nameInput) {
    startButton.addEventListener("click", () => {
      const name = nameInput.value.trim();
      if (name) {
        startGame(name);
      } else {
        // Efeito de shake no input
        nameInput.classList.add("shake");
        setTimeout(() => nameInput.classList.remove("shake"), 500);
        playErrorSound();
      }
    });

    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const name = nameInput.value.trim();
        if (name) {
          startGame(name);
        }
      }
    });

    // Efeito de som ao digitar (som 8-bit)
    nameInput.addEventListener("input", () => {
      play8BitSound(800, 0.05);
    });
  }
};

// Som 8-bit de digitação
function play8BitSound(frequency: number, duration: number) {
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "square"; // Som quadrado = 8-bit

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Som de erro 8-bit
function playErrorSound() {
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = "sawtooth";
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);

  // Sequência de frequências para erro
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.2);

  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.3,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

// Som de digitação
function playTypingSound() {
  play8BitSound(800 + Math.random() * 200, 0.05);
}

// Inicializa a tela de boas-vindas quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", setupWelcomeScreen);
(0.01,
  // Inicializa a tela de boas-vindas quando o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", setupWelcomeScreen));

async function saveGameToBackend(xp: number, level: number, username: string) {
  const pData = {
    username: username,
    xp: xp,
    level: level,
  };

  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pData),
    });

    if (response.ok) {
      console.log("✅ Progresso salvo no servidor Go!");
    }
  } catch (error) {
    console.error("❌ Erro ao conectar com o Back-end:", error);
  }
}
