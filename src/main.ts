import Phaser from "phaser";
import "./retro-theme.css";
import "./style.css";

interface Upgrade {
  name: string;
  cost: number;
  level: number;
  maxLevel: number;
  description: string;
}

let playerName = "";

class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
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

  private money = 0;
  private fireRate = 500;
  private dmg = 1;
  private coinMultiplier = 1;
  private lastShot = 0;
  private speed = 200;

  private moneyText!: Phaser.GameObjects.Text;
  private upgradeMenu!: Phaser.GameObjects.Text;
  private shopZone!: Phaser.GameObjects.Rectangle;
  private isInShop = false;

  private upgrades: Record<string, Upgrade> = {
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
    this.load.audio("background_music", "assets/audio/17014-svphvr.mp3");
  }

  create() {
    if (this.cache.audio.exists("background_music")) {
      this.bgMusic = this.sound.add("background_music", {
        loop: true,
        volume: 0.3,
      });
      this.bgMusic.play();
    }

    const { width, height } = this.cameras.main;
    this.physics.world.setBounds(0, 0, width, height);
    this.setupPlayer();
    this.setupControls();
    this.setupGroups();
    this.setupCollisions();
    this.setupUI();
    this.setupShop();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isInShop) this.shoot(pointer.x, pointer.y);
    });

    this.time.addEvent({
      delay: 2000,
      callback: this.spawnBox,
      callbackScope: this,
      loop: true,
    });
  }

  private setupPlayer() {
    const { width, height } = this.cameras.main;
    this.player = this.add.rectangle(width / 2, height / 2, 30, 30, 0x00ff00);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(
      true,
    );
  }

  private setupControls() {
    this.wasd = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as any;
  }

  private setupGroups() {
    this.bullets = this.physics.add.group();
    this.boxes = this.physics.add.group();
    this.coins = this.physics.add.group();
  }

  private setupCollisions() {
    this.physics.add.overlap(
      this.bullets,
      this.boxes,
      this.onBulletHit as any,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.onCoinCollect as any,
      undefined,
      this,
    );
  }

  private setupUI() {
    this.moneyText = this.add
      .text(16, 16, `💰 $${this.money}`, {
        fontSize: "24px",
        color: "#FFD700",
        fontFamily: "Arial",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(100);

    const { width, height } = this.cameras.main;
    this.add
      .text(
        width / 2,
        height - 50,
        `Bem-vindo, ${playerName}! WASD para mover, Mouse para atirar`,
        {
          fontSize: "14px",
          color: "#fff",
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);
  }

  private setupShop() {
    this.shopZone = this.add.rectangle(100, 100, 180, 180, 0x4444ff, 0.3);
    this.add
      .text(100, 50, "🏪 LOJA", {
        fontSize: "20px",
        color: "#fff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    const { width, height } = this.cameras.main;
    this.upgradeMenu = this.add
      .text(width / 2, height / 2, "", {
        fontSize: "16px",
        color: "#fff",
        backgroundColor: "#000",
        padding: { x: 10, y: 10 },
        align: "center",
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  update() {
    this.handleMovement();
    this.checkShopProximity();
  }

  private handleMovement() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (this.wasd.W.isDown) body.setVelocityY(-this.speed);
    else if (this.wasd.S.isDown) body.setVelocityY(this.speed);

    if (this.wasd.A.isDown) body.setVelocityX(-this.speed);
    else if (this.wasd.D.isDown) body.setVelocityX(this.speed);
  }

  private checkShopProximity() {
    const playerInShop = Phaser.Geom.Rectangle.Contains(
      this.shopZone.getBounds(),
      this.player.x,
      this.player.y,
    );

    if (playerInShop && !this.isInShop) {
      this.openShop();
    } else if (!playerInShop && this.isInShop) {
      this.closeShop();
    }
  }

  private shoot(targetX: number, targetY: number) {
    const now = this.time.now;
    if (now - this.lastShot < this.fireRate) return;

    this.lastShot = now;

    const bullet = this.add.rectangle(
      this.player.x,
      this.player.y,
      8,
      8,
      0xffff00,
    );
    this.bullets.add(bullet);
    this.physics.add.existing(bullet);

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      targetX,
      targetY,
    );

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    const velocityX = Math.cos(angle) * 400;
    const velocityY = Math.sin(angle) * 400;
    body.setVelocity(velocityX, velocityY);

    this.time.delayedCall(2000, () => bullet.destroy());
  }

  private spawnBox() {
    const { width, height } = this.cameras.main;
    const x = Phaser.Math.Between(width * 0.25, width * 0.875);
    const y = Phaser.Math.Between(height * 0.15, height * 0.85);

    const box = this.add.rectangle(x, y, 40, 40, 0xff6600);
    box.setStrokeStyle(2, 0x000000);
    this.boxes.add(box);
    this.physics.add.existing(box);
    (box as any).hp = this.dmg;
  }

  private onBulletHit(bullet: any, box: any) {
    bullet.destroy();
    box.hp -= this.dmg;

    if (box.hp <= 0) {
      this.dropCoins(box.x, box.y);
      box.destroy();
    }
  }

  private dropCoins(x: number, y: number) {
    const amount = Phaser.Math.Between(2, 5) * this.coinMultiplier;

    for (let i = 0; i < amount; i++) {
      const offsetX = Phaser.Math.Between(-20, 20);
      const offsetY = Phaser.Math.Between(-20, 20);
      const coin = this.add.circle(x + offsetX, y + offsetY, 8, 0xffd700);

      this.coins.add(coin);
      this.physics.add.existing(coin);

      const body = coin.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Phaser.Math.Between(-50, 50),
        Phaser.Math.Between(-100, -50),
      );
      body.setGravityY(300);
      body.setBounce(0.5);
      body.setCollideWorldBounds(true);

      this.time.delayedCall(5000, () => {
        if (coin.active) coin.destroy();
      });
    }
  }

  private onCoinCollect(_player: any, coin: any) {
    coin.destroy();
    this.money += 10;
    this.moneyText.setText(`💰 $${this.money}`);
    play8BitSound(1000, 0.1);
  }

  private openShop() {
    this.isInShop = true;
    this.renderShopMenu();
  }

  private closeShop() {
    this.isInShop = false;
    this.upgradeMenu.setVisible(false);
  }

  private renderShopMenu() {
    let menu = "=== LOJA ===\n\n";
    const upgradeList = Object.keys(this.upgrades);

    upgradeList.forEach((key, idx) => {
      const upg = this.upgrades[key];
      const affordable = this.money >= upg.cost;
      const maxed = upg.level >= upg.maxLevel;
      const status = maxed ? "(MAX)" : affordable ? "✓" : "✗";

      menu += `${idx + 1}. ${upg.name} [Nv${upg.level}/${upg.maxLevel}]\n`;
      menu += `   ${upg.description}\n`;
      menu += `   Custo: $${upg.cost} ${status}\n\n`;
    });

    menu += "Pressione 1-4 para comprar\nSaia da área para fechar";

    this.upgradeMenu.setText(menu);
    this.upgradeMenu.setVisible(true);

    this.bindUpgradeKeys();
  }

  private bindUpgradeKeys() {
    const keyMap = ["ONE", "TWO", "THREE", "FOUR"];
    const upgradeKeys = Object.keys(this.upgrades);

    keyMap.forEach((keyName, idx) => {
      const key = this.input.keyboard!.addKey(keyName);
      key.once("down", () => {
        if (this.isInShop && upgradeKeys[idx]) {
          this.purchaseUpgrade(upgradeKeys[idx]);
        }
      });
    });
  }

  private purchaseUpgrade(key: string) {
    const upg = this.upgrades[key];

    if (upg.level >= upg.maxLevel) {
      play8BitSound(200, 0.2);
      return;
    }

    if (this.money < upg.cost) {
      play8BitSound(200, 0.2);
      return;
    }

    this.money -= upg.cost;
    upg.level++;
    upg.cost = Math.floor(upg.cost * 1.5);

    this.applyUpgrade(key);
    this.moneyText.setText(`💰 $${this.money}`);
    this.renderShopMenu();
    play8BitSound(800, 0.2);
  }

  private applyUpgrade(key: string) {
    switch (key) {
      case "fireRate":
        this.fireRate = Math.max(100, this.fireRate - 50);
        break;
      case "damage":
        this.dmg++;
        break;
      case "coinValue":
        this.coinMultiplier++;
        break;
      case "speed":
        this.speed += 30;
        break;
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  backgroundColor: "#1a1a2e",
};

function startGame(name: string) {
  playerName = name;
  const welcome = document.getElementById("welcome-screen");
  const container = document.getElementById("game-container");

  playStartSound();

  if (welcome) {
    welcome.classList.add("fade-out");
    setTimeout(() => {
      welcome.style.display = "none";
      if (container) {
        container.style.display = "block";
        container.classList.add("fade-in");
      }
      new Phaser.Game(config);
    }, 800);
  }
}

function playStartSound() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "square";
  gain.gain.setValueAtTime(0.3, ctx.currentTime);

  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
  });

  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

function setupWelcome() {
  const nameInput = document.getElementById("player-name") as HTMLInputElement;
  const startBtn = document.getElementById("start-button") as HTMLButtonElement;

  if (!startBtn || !nameInput) return;

  const tryStart = () => {
    const name = nameInput.value.trim();
    if (name) {
      startGame(name);
    } else {
      nameInput.classList.add("shake");
      setTimeout(() => nameInput.classList.remove("shake"), 500);
      playErrorSound();
    }
  };

  startBtn.addEventListener("click", tryStart);
  nameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") tryStart();
  });
  nameInput.addEventListener("input", () => play8BitSound(800, 0.05));
}

function play8BitSound(freq: number, duration: number) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = freq;
  osc.type = "square";

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playErrorSound() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sawtooth";
  gain.gain.setValueAtTime(0.2, ctx.currentTime);

  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
  osc.frequency.setValueAtTime(100, ctx.currentTime + 0.2);

  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

document.addEventListener("DOMContentLoaded", setupWelcome);

// Backend integration (unused for now)
// async function saveGameToBackend(xp: number, level: number, username: string) {
//   try {
//     const res = await fetch("/api/save", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username, xp, level }),
//     });
//     if (res.ok) console.log("✅ Progresso salvo!");
//   } catch (err) {
//     console.error("❌ Erro ao salvar:", err);
//   }
// }
