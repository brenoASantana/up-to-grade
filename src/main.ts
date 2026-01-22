import Phaser from "phaser";
import "./retro-theme.css";
import "./style.css";

let playerName: string = "";

// Tipos de upgrades disponíveis
interface UpgradeData {
  name: string;
  cost: number;
  level: number;
  maxLevel: number;
  description: string;
}

class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private bullets!: Phaser.Physics.Arcade.Group;
  private boxes!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private bgMusic!: Phaser.Sound.BaseSound;

  // Stats do jogador
  private money: number = 0;
  private fireRate: number = 500; // ms entre tiros
  private damage: number = 1;
  private coinMultiplier: number = 1;
  private lastFired: number = 0;
  private playerSpeed: number = 200;

  // UI
  private moneyText!: Phaser.GameObjects.Text;
  private upgradeText!: Phaser.GameObjects.Text;
  private shopZone!: Phaser.GameObjects.Rectangle;
  private shopText!: Phaser.GameObjects.Text;
  private inShop: boolean = false;

  // Upgrades
  private upgrades: { [key: string]: UpgradeData } = {
    fireRate: {
      name: "Cadência de Tiro",
      cost: 50,
      level: 0,
      maxLevel: 10,
      description: "Atira mais rápido",
    },
    damage: {
      name: "Dano",
      cost: 100,
      level: 0,
      maxLevel: 10,
      description: "Causa mais dano",
    },
    coinValue: {
      name: "Multiplicador $",
      cost: 75,
      level: 0,
      maxLevel: 10,
      description: "Mais moedas das caixas",
    },
    speed: {
      name: "Velocidade",
      cost: 60,
      level: 0,
      maxLevel: 5,
      description: "Move mais rápido",
    },
  };

  constructor() {
    super("GameScene");
  }

  preload() {
    // Carrega a música de fundo: 17014 - Svphvr
    this.load.audio("background_music", "assets/audio/17014-svphvr.mp3");
  }

  create() {
    // Toca a música de fundo em loop: 17014 - Svphvr
    if (this.cache.audio.exists("background_music")) {
      this.bgMusic = this.sound.add("background_music", {
        loop: true,
        volume: 0.3,
      });
      this.bgMusic.play();
    }

    // Configura física
    this.physics.world.setBounds(0, 0, 800, 600);

    // Cria o jogador (quadrado verde)
    this.player = this.add.rectangle(400, 300, 30, 30, 0x00ff00);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(
      true,
    );

    // Controles WASD
    this.wasd = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as any;

    // Grupos de objetos
    this.bullets = this.physics.add.group();
    this.boxes = this.physics.add.group();
    this.coins = this.physics.add.group();

    // Colisões
    this.physics.add.overlap(
      this.bullets,
      this.boxes,
      this.hitBox as any,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin as any,
      undefined,
      this,
    );

    // UI do dinheiro
    this.moneyText = this.add.text(16, 16, `💰 $${this.money}`, {
      fontSize: "24px",
      color: "#FFD700",
      fontFamily: "Arial",
      stroke: "#000",
      strokeThickness: 4,
    });

    // Zona da loja (canto superior esquerdo)
    this.shopZone = this.add.rectangle(100, 100, 180, 180, 0x4444ff, 0.3);
    this.shopText = this.add
      .text(100, 50, "🏪 LOJA", {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Texto de upgrade (inicialmente invisível)
    this.upgradeText = this.add
      .text(400, 300, "", {
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#000",
        padding: { x: 10, y: 10 },
        align: "center",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(1000);

    // Tiro com mouse
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.inShop) {
        this.shoot(pointer.x, pointer.y);
      }
    });

    // Spawna caixas periodicamente
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnBox,
      callbackScope: this,
      loop: true,
    });

    // Informações iniciais
    this.add
      .text(
        400,
        550,
        `Bem-vindo, ${playerName}! WASD para mover, Mouse para atirar`,
        {
          fontSize: "14px",
          color: "#fff",
        },
      )
      .setOrigin(0.5);
  }

  update(time: number) {
    // Movimento WASD
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (this.wasd.W.isDown) {
      body.setVelocityY(-this.playerSpeed);
    } else if (this.wasd.S.isDown) {
      body.setVelocityY(this.playerSpeed);
    }

    if (this.wasd.A.isDown) {
      body.setVelocityX(-this.playerSpeed);
    } else if (this.wasd.D.isDown) {
      body.setVelocityX(this.playerSpeed);
    }

    // Verifica se está na zona da loja
    const inShopZone = Phaser.Geom.Rectangle.Contains(
      this.shopZone.getBounds(),
      this.player.x,
      this.player.y,
    );

    if (inShopZone && !this.inShop) {
      this.enterShop();
    } else if (!inShopZone && this.inShop) {
      this.exitShop();
    }
  }

  shoot(targetX: number, targetY: number) {
    const time = this.time.now;
    if (time - this.lastFired < this.fireRate) return;

    this.lastFired = time;

    // Cria bala
    const bullet = this.add.rectangle(
      this.player.x,
      this.player.y,
      8,
      8,
      0xffff00,
    );
    this.bullets.add(bullet);
    this.physics.add.existing(bullet);

    // Calcula direção
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      targetX,
      targetY,
    );

    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;
    bulletBody.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

    // Remove bala após sair da tela
    this.time.delayedCall(2000, () => {
      bullet.destroy();
    });
  }

  spawnBox() {
    const x = Phaser.Math.Between(200, 700);
    const y = Phaser.Math.Between(100, 500);

    const box = this.add.rectangle(x, y, 40, 40, 0xff6600);
    box.setStrokeStyle(2, 0x000000);
    this.boxes.add(box);
    this.physics.add.existing(box);
    (box as any).health = this.damage;
  }

  hitBox(bullet: any, box: any) {
    bullet.destroy();

    box.health -= this.damage;

    if (box.health <= 0) {
      // Spawna moedas
      const numCoins = Phaser.Math.Between(2, 5) * this.coinMultiplier;
      for (let i = 0; i < numCoins; i++) {
        const coin = this.add.circle(
          box.x + Phaser.Math.Between(-20, 20),
          box.y + Phaser.Math.Between(-20, 20),
          8,
          0xffd700,
        );
        this.coins.add(coin);
        this.physics.add.existing(coin);

        // Moeda cai com gravidade
        const coinBody = coin.body as Phaser.Physics.Arcade.Body;
        coinBody.setVelocity(
          Phaser.Math.Between(-50, 50),
          Phaser.Math.Between(-100, -50),
        );
        coinBody.setGravityY(300);
        coinBody.setBounce(0.5);
        coinBody.setCollideWorldBounds(true);

        // Remove moeda após 5 segundos
        this.time.delayedCall(5000, () => {
          if (coin.active) coin.destroy();
        });
      }

      box.destroy();
    }
  }

  collectCoin(player: any, coin: any) {
    coin.destroy();
    this.money += 10;
    this.moneyText.setText(`💰 $${this.money}`);

    // Som de coleta
    play8BitSound(1000, 0.1);
  }

  enterShop() {
    this.inShop = true;
    this.showUpgradeMenu();
  }

  exitShop() {
    this.inShop = false;
    this.upgradeText.setVisible(false);
  }

  showUpgradeMenu() {
    let menuText = "=== LOJA ===\n\n";
    let index = 1;

    for (const key in this.upgrades) {
      const upgrade = this.upgrades[key];
      const canAfford = this.money >= upgrade.cost;
      const isMaxed = upgrade.level >= upgrade.maxLevel;

      menuText += `${index}. ${upgrade.name} [Nv${upgrade.level}/${upgrade.maxLevel}]\n`;
      menuText += `   ${upgrade.description}\n`;
      menuText += `   Custo: $${upgrade.cost} ${isMaxed ? "(MAX)" : canAfford ? "✓" : "✗"}\n\n`;
      index++;
    }

    menuText += "Pressione 1-4 para comprar\nSaia da área para fechar";

    this.upgradeText.setText(menuText);
    this.upgradeText.setVisible(true);
    this.upgradeText.setPosition(400, 300);

    // Configura teclas de compra
    this.setupUpgradeKeys();
  }

  setupUpgradeKeys() {
    const keys = ["ONE", "TWO", "THREE", "FOUR"];
    const upgradeKeys = Object.keys(this.upgrades);

    keys.forEach((key, index) => {
      const keyboard = this.input.keyboard!.addKey(key);
      keyboard.once("down", () => {
        if (this.inShop && upgradeKeys[index]) {
          this.buyUpgrade(upgradeKeys[index]);
        }
      });
    });
  }

  buyUpgrade(upgradeKey: string) {
    const upgrade = this.upgrades[upgradeKey];

    if (upgrade.level >= upgrade.maxLevel) {
      play8BitSound(200, 0.2); // Som de erro
      return;
    }

    if (this.money >= upgrade.cost) {
      this.money -= upgrade.cost;
      upgrade.level++;
      upgrade.cost = Math.floor(upgrade.cost * 1.5);

      // Aplica efeito do upgrade
      switch (upgradeKey) {
        case "fireRate":
          this.fireRate = Math.max(100, this.fireRate - 50);
          break;
        case "damage":
          this.damage++;
          break;
        case "coinValue":
          this.coinMultiplier++;
          break;
        case "speed":
          this.playerSpeed += 30;
          break;
      }

      this.moneyText.setText(`💰 $${this.money}`);
      this.showUpgradeMenu(); // Atualiza menu

      // Som de compra
      play8BitSound(800, 0.2);
    } else {
      // Som de erro
      play8BitSound(200, 0.2);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  backgroundColor: "#1a1a2e",
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
