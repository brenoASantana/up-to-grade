import Phaser from "phaser";
import "./style.css";

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
        saveGameToBackend(this.score, this.level).catch(() => {});
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
};

new Phaser.Game(config);

async function saveGameToBackend(xp: number, level: number) {
  const pData = {
    username: "EstagiarioGlobo", // Poderia ser dinâmico
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
