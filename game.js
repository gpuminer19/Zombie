// Конфиг игры
const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: window.innerWidth,
  height: window.innerHeight - 60,
  backgroundColor: '#111',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: { preload, create, update }
};

window.gameInstance = new Phaser.Game(config);

// Глобальные переменные
let player, arrows, monsters;
let coinText;
let floorMultiplier = 1.0;
let currentFloor = 1;
let requiredBMForNextFloor = 500;
let currentBM = 0;

// Система уровней
let playerLevel = 1;
let playerExp = 0;
let expToNextLevel = 100;

// Базовые характеристики монстров
const BASE_MONSTER_HP = 80;
const BASE_MONSTER_DAMAGE = 10;
const BASE_MONSTER_SPEED = 200;

// Скорость атаки монстров (мс между атаками)
const MONSTER_ATTACK_DELAY = 600;  // 600мс = 0.6 секунды (было 1000)
const BOSS_ATTACK_DELAY = 450;     // Босс атакует ещё быстрее

// Ограничение на количество монстров
const MAX_MONSTERS = 1;

// Босс система
let isBossBattle = false;
let currentBoss = null;
let bossMonster = null;

// Тени
let playerShadow = null;
let bgVideo = null;

// Игровые параметры
window.gameState = {
  coins: 100,
  damage: 10,
  attackSpeed: 1.0,
  fireDelay: 400,
  critChance: 0,
  critDamage: 1.5,
  kills: 0
};

let laneY;
let shootingEnabled = true;
let isPlayerDead = false;

function updateFireDelay() {
  const delay = Math.max(100, Math.floor(1000 / window.gameState.attackSpeed));
  window.gameState.fireDelay = delay;
}

function preload() {
    // Игрок
    this.load.spritesheet('idle', 'idle.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('shot', 'shot.png', { frameWidth: 128, frameHeight: 128 });
    
    // Монстр 1 (этажи 1-4)
    this.load.spritesheet('monster', 'mon.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('monster_attack', 'monatk.png', { frameWidth: 96, frameHeight: 95 });
    
    // Монстр 2 (этажи 5+)
    this.load.spritesheet('monster2', 'mon2.png', { frameWidth: 96, frameHeight: 95 });
    this.load.spritesheet('monster_attack2', 'monatk2.png', { frameWidth: 96, frameHeight: 95 });
    
    // Босс
    this.load.spritesheet('boss_idle', 'bosss.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('boss_attack', 'bosssatk.png', { frameWidth: 128, frameHeight: 127 });
    
    this.load.image('arrow', 'https://labs.phaser.io/assets/sprites/bullets/bullet7.png');
    this.load.video('fon', 'fon.mp4');
}

function create() {
  laneY = this.scale.height - 40;
  isPlayerDead = false;
  
  loadFloorProgress();

  // ========== ВИДЕО-ФОН ==========
  bgVideo = this.add.video(0, 0, 'fon');
  bgVideo.setOrigin(0.5, 0.5);
  bgVideo.setDepth(-999);
  bgVideo.setMute(true);
  bgVideo.setLoop(true);
  
  const resizeBgVideo = () => {
    if (!bgVideo || !bgVideo.video) return;
    const scaleX = this.scale.width / bgVideo.video.videoWidth;
    const scaleY = this.scale.height / bgVideo.video.videoHeight;
    const scale = Math.max(scaleX, scaleY);
    bgVideo.setScale(scale);
    bgVideo.x = this.scale.width / 2;
    bgVideo.y = this.scale.height / 2;
  };
  
  bgVideo.play(true);
  bgVideo.on('loadeddata', resizeBgVideo);
  setTimeout(resizeBgVideo, 100);
  
  this.scale.on('resize', () => {
    resizeBgVideo();
    laneY = this.scale.height - 40;
    if (player) player.y = laneY;
    if (playerShadow) playerShadow.y = laneY + 5;
    if (monsters) monsters.getChildren().forEach(m => { 
      m.y = laneY;
      if (m.shadow) m.shadow.y = laneY + 5;
    });
    if (bossMonster && bossMonster.active) {
      bossMonster.y = laneY;
      if (bossMonster.shadow) bossMonster.shadow.y = laneY + 8;
    }
  });

  // Анимации игрока
  this.anims.create({
    key: 'idle_anim',
    frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 8 }),
    frameRate: 8,
    repeat: -1
  });
  this.anims.create({
    key: 'shot_anim',
    frames: this.anims.generateFrameNumbers('shot', { start: 0, end: 3 }),
    frameRate: 12
  });
  
  // Анимации монстра 1
  this.anims.create({
    key: 'monster_walk',
    frames: this.anims.generateFrameNumbers('monster', { start: 0, end: 7 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'monster_attack_anim',
    frames: this.anims.generateFrameNumbers('monster_attack', { start: 0, end: 3 }),
    frameRate: 15,
    repeat: 0
  });
  
  // Анимации монстра 2
  this.anims.create({
    key: 'monster_walk2',
    frames: this.anims.generateFrameNumbers('monster2', { start: 0, end: 6 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: 'monster_attack_anim2',
    frames: this.anims.generateFrameNumbers('monster_attack2', { start: 0, end: 3 }),
    frameRate: 15,
    repeat: 0
  });
  
  // Анимации босса
  this.anims.create({
    key: 'boss_walk',
    frames: this.anims.generateFrameNumbers('boss_idle', { start: 0, end: 9 }),
    frameRate: 8,
    repeat: -1
  });
  this.anims.create({
    key: 'boss_attack_anim',
    frames: this.anims.generateFrameNumbers('boss_attack', { start: 0, end: 3 }),
    frameRate: 12,
    repeat: 0
  });

  player = this.physics.add.sprite(80, laneY, 'idle');
  player.setOrigin(0.5, 1);
  player.setScale(1);
  player.play('idle_anim');
  player.setImmovable(true);
  player.body.setSize(60, 80);
  player.body.setOffset(34, 48);
  player.setDepth(10);
  
  // Тень игрока
  playerShadow = this.add.ellipse(80, laneY + 5, 60, 18, 0x000000, 0.5);
  playerShadow.setDepth(9);

  arrows = this.physics.add.group();
  monsters = this.physics.add.group();

  startShooting.call(this);
  
  // Спавн первого монстра
  spawnMonster.call(this);

  this.physics.add.overlap(arrows, monsters, hitMonster, null, this);
  this.physics.add.overlap(player, monsters, monsterAttackPlayer, null, this);
  this.physics.add.collider(monsters, monsters, null, null, this);

  if (window.onGameReady) window.onGameReady();
  
  updateFireDelay();
  updateFloorUI();
  updateLevelUI();
  updateStats();
}

// Функция для получения типа монстра в зависимости от этажа
function getMonsterType() {
  // Этажи 1-4 - первый монстр
  // Этажи 5+ - второй монстр
  return currentFloor >= 5 ? 2 : 1;
}

function saveFloorProgress() {
  const saveData = {
    currentFloor: currentFloor,
    currentBM: currentBM,
    floorMultiplier: floorMultiplier,
    playerLevel: playerLevel,
    playerExp: playerExp,
    expToNextLevel: expToNextLevel
  };
  localStorage.setItem('floorProgress', JSON.stringify(saveData));
}

function loadFloorProgress() {
  const saved = localStorage.getItem('floorProgress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentFloor = data.currentFloor || 1;
      currentBM = data.currentBM || 0;
      floorMultiplier = data.floorMultiplier || Math.pow(1.1, currentFloor - 1);
      playerLevel = data.playerLevel || 1;
      playerExp = data.playerExp || 0;
      expToNextLevel = data.expToNextLevel || 100;
    } catch(e) {}
  }
  updateRequiredBM();
  updateFloorUI();
}

function updateRequiredBM() {
  requiredBMForNextFloor = 500 * currentFloor;
  updateFloorUI();
}

function clearAllMonsters() {
  if (monsters) {
    const allMonsters = monsters.getChildren();
    for (let i = allMonsters.length - 1; i >= 0; i--) {
      const m = allMonsters[i];
      if (m.hpBar) m.hpBar.destroy();
      if (m.hpBarBg) m.hpBarBg.destroy();
      if (m.shadow) m.shadow.destroy();
      if (m.nameText) m.nameText.destroy();
      m.destroy();
    }
    monsters.clear(true, true);
  }
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.cssText = `position:fixed; bottom:140px; left:16px; right:16px; background:${isError ? '#ff5252' : '#4caf50'}; color:white; padding:12px; border-radius:16px; text-align:center; z-index:200; animation:fadeOut 2s forwards; font-size:13px; font-weight:bold;`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function addExp(amount) {
  playerExp += amount;
  let leveledUp = false;
  
  while (playerExp >= expToNextLevel) {
    playerExp -= expToNextLevel;
    playerLevel++;
    expToNextLevel = Math.floor(expToNextLevel * 1.5);
    leveledUp = true;
    
    const newDamage = 10 + (playerLevel - 1) * 2;
    const newAttackSpeed = 1.0 + (playerLevel - 1) * 0.2;
    
    window.gameState.damage = newDamage;
    window.gameState.attackSpeed = parseFloat(newAttackSpeed.toFixed(1));
    updateFireDelay();
    
    if (typeof applyEquipmentStats === 'function') {
        applyEquipmentStats();
    }
    
    updateStats();
    
    showToast(`🎉 УРОВЕНЬ ${playerLevel}! Урон +2 (${newDamage}), Скорость +0.2 (${newAttackSpeed.toFixed(1)})! 🎉`);
  }
  
  if (leveledUp) {
    updateLevelUI();
    saveFloorProgress();
  }
  
  const expPercent = (playerExp / expToNextLevel) * 100;
  const expFill = document.getElementById('expProgress');
  if (expFill) expFill.style.width = Math.min(100, expPercent) + '%';
  const levelSpan = document.getElementById('playerLevel');
  if (levelSpan) levelSpan.innerText = playerLevel;
  
  updatePowerDisplay();
}

function updateLevelUI() {
  const expPercent = (playerExp / expToNextLevel) * 100;
  const expFill = document.getElementById('expProgress');
  if (expFill) expFill.style.width = Math.min(100, expPercent) + '%';
  const levelSpan = document.getElementById('playerLevel');
  if (levelSpan) levelSpan.innerText = playerLevel;
}

function nextFloor() {
  const playerBM = calculatePower();
  
  if (playerBM < requiredBMForNextFloor) {
    const needed = requiredBMForNextFloor - playerBM;
    showToast(`⚠️ НУЖНО НАБРАТЬ ЕЩЁ ${needed} БМ ДЛЯ ПЕРЕХОДА НА ${currentFloor + 1} ЭТАЖ! ⚠️`, true);
    return;
  }
  
  currentFloor++;
  floorMultiplier = Math.pow(1.1, currentFloor - 1);
  updateRequiredBM();
  
  clearAllMonsters();
  updateFloorUI();
  saveFloorProgress();
  
  showToast(`🏢 ЭТАЖ ${currentFloor} | Требуется БМ: ${requiredBMForNextFloor}`);
  
  setTimeout(() => {
    if (!isBossBattle && !isPlayerDead && monsters.getChildren().length === 0) {
      const scene = window.gameInstance.scene.scenes[0];
      if (scene) spawnMonster.call(scene);
    }
  }, 100);
}

function prevFloor() {
  if (currentFloor <= 1) {
    showToast(`❌ НЕЛЬЗЯ СПУСТИТЬСЯ НИЖЕ 1 ЭТАЖА!`, true);
    return;
  }
  
  currentFloor--;
  floorMultiplier = Math.pow(1.1, currentFloor - 1);
  updateRequiredBM();
  
  clearAllMonsters();
  updateFloorUI();
  saveFloorProgress();
  
  showToast(`🏢 ЭТАЖ ${currentFloor} | Требуется БМ: ${requiredBMForNextFloor}`);
  
  setTimeout(() => {
    if (!isBossBattle && !isPlayerDead && monsters.getChildren().length === 0) {
      const scene = window.gameInstance.scene.scenes[0];
      if (scene) spawnMonster.call(scene);
    }
  }, 100);
}

function updateFloorUI() {
  const floorInfo = document.getElementById('floorInfo');
  const floorRequired = document.getElementById('floorRequired');
  
  if (floorInfo) {
    floorInfo.innerHTML = `🏢 ЭТАЖ ${currentFloor}`;
  }
  
  if (floorRequired) {
    floorRequired.innerHTML = `🎯 ДЛЯ ПЕРЕХОДА НУЖНО: ${requiredBMForNextFloor} БМ`;
  }
}

function calculatePower() {
  const damage = window.gameState.damage;
  const attackSpeed = window.gameState.attackSpeed;
  const critChance = window.gameState.critChance;
  const critDamage = (window.gameState.critDamage - 1) * 100;
  const level = playerLevel;
  
  const power = Math.floor(
    (damage * 10) +
    (attackSpeed * 100) +
    (critChance * 5) +
    (critDamage * 2) +
    (level * 50)
  );
  
  return power;
}

function updatePowerDisplay() {
  const powerSpan = document.getElementById('playerPower');
  if (powerSpan) {
    const power = calculatePower();
    powerSpan.innerText = power.toLocaleString();
  }
}

function checkAndSpawnNextMonster(scene) {
  if (!isPlayerDead && !isBossBattle && monsters.getChildren().length === 0) {
    setTimeout(() => {
      if (!isPlayerDead && !isBossBattle && monsters.getChildren().length === 0) {
        if (scene) spawnMonster.call(scene);
      }
    }, 50);
  }
}

function update() {
  if (isPlayerDead) return;
  
  const w = this.scale.width;
  if (player && player.y !== laneY) player.y = laneY;

  if (arrows) {
    arrows.getChildren().forEach(a => { if (a.x > w) a.destroy(); });
  }

  if (playerShadow) {
    playerShadow.x = player.x;
    playerShadow.y = player.y + 5;
  }

  if (isBossBattle && bossMonster && bossMonster.active) {
    if (bossMonster.x < -200) {
      if (bossMonster.hpBar) bossMonster.hpBar.destroy();
      if (bossMonster.hpBarBg) bossMonster.hpBarBg.destroy();
      if (bossMonster.nameText) bossMonster.nameText.destroy();
      if (bossMonster.shadow) bossMonster.shadow.destroy();
      monsters.remove(bossMonster, true, true);
      bossMonster = null;
      isBossBattle = false;
      if (typeof window.recordBossAttempt === 'function') {
        window.recordBossAttempt(currentBoss?.level);
      }
      showToast(`❌ Босс ушёл! Вы проиграли! Попытка засчитана.`, true);
      currentBoss = null;
      if (typeof renderBossUI === 'function') {
        setTimeout(() => renderBossUI(), 500);
      }
      return;
    }
    
    if (bossMonster.hpBar) {
      bossMonster.hpBarBg.x = bossMonster.x;
      bossMonster.hpBarBg.y = bossMonster.y - 100;
      bossMonster.hpBar.x = bossMonster.x;
      bossMonster.hpBar.y = bossMonster.y - 100;
      bossMonster.hpBar.width = 200 * (bossMonster.hp / bossMonster.maxHp);
    }
    if (bossMonster.nameText) {
      bossMonster.nameText.x = bossMonster.x;
      bossMonster.nameText.y = bossMonster.y - 120;
    }
    if (bossMonster.shadow) {
      bossMonster.shadow.x = bossMonster.x;
      bossMonster.shadow.y = bossMonster.y + 8;
    }
    
    if (!bossMonster.isWaiting) {
      if (bossMonster.x < player.x + 70) {
        bossMonster.setVelocityX(0);
        bossMonster.isWaiting = true;
      } else {
        bossMonster.setVelocityX(-currentBoss?.speed || 30);
        bossMonster.isWaiting = false;
      }
    } else {
      if (bossMonster.x > player.x + 70) {
        bossMonster.isWaiting = false;
        bossMonster.setVelocityX(-currentBoss?.speed || 30);
      }
    }
  }

  if (monsters && !isBossBattle) {
    monsters.getChildren().forEach(m => {
      if (!m.isBoss && m.x < -100) {
        if (m.hpBar) m.hpBar.destroy();
        if (m.hpBarBg) m.hpBarBg.destroy();
        if (m.shadow) m.shadow.destroy();
        m.destroy();
        checkAndSpawnNextMonster(this);
        return;
      }

      if (!m.isBoss && m.active && m.hpBar) {
        m.hpBarBg.x = m.x;
        m.hpBarBg.y = m.y - 90;
        m.hpBar.x = m.x;
        m.hpBar.y = m.y - 90;
        m.hpBar.width = 60 * (m.hp / m.maxHp);
      }
      
      if (m.shadow) {
        m.shadow.x = m.x;
        m.shadow.y = m.y + 5;
      }
      
      if (!m.isBoss && !m.isWaiting) {
        const monsterAhead = monsters.getChildren().some(other => 
          other !== m && Math.abs(other.x - m.x) < 45 && other.x < m.x && other.x > player.x
        );
        
        if (m.x < player.x + 45 || monsterAhead) {
          m.setVelocityX(0);
          m.isWaiting = true;
        } else {
          m.setVelocityX(-BASE_MONSTER_SPEED);
          m.isWaiting = false;
        }
      } else if (!m.isBoss) {
        const monsterAhead = monsters.getChildren().some(other => 
          other !== m && Math.abs(other.x - m.x) < 45 && other.x < m.x && other.x > player.x
        );
        const tooClose = m.x < player.x + 45;
        
        if (!monsterAhead && !tooClose) {
          m.isWaiting = false;
          m.setVelocityX(-BASE_MONSTER_SPEED);
        }
      }
    });
  }
}

function hasAliveMonsters() {
  if (isBossBattle) {
    return bossMonster && bossMonster.active;
  }
  return monsters && monsters.getChildren().some(m => m.active && !m.isBoss && m.x > player.x);
}

function startShooting() { shoot.call(this); }

function shoot() {
  if (isPlayerDead || !shootingEnabled) return;
  
  let hasTarget = false;
  if (isBossBattle) {
    hasTarget = bossMonster && bossMonster.active;
  } else {
    hasTarget = monsters && monsters.getChildren().some(m => m.active && !m.isBoss && m.x > player.x);
  }
  
  if (!hasTarget) {
    this.time.delayedCall(200, () => shoot.call(this));
    return;
  }

  shootingEnabled = false;
  player.play('shot_anim');

  this.time.delayedCall(80, () => fireArrow.call(this));

  player.once('animationcomplete', () => {
    player.play('idle_anim');
    this.time.delayedCall(window.gameState.fireDelay, () => {
      shootingEnabled = true;
      shoot.call(this);
    });
  });
}

function fireArrow() {
  let hasTarget = false;
  if (isBossBattle) {
    hasTarget = bossMonster && bossMonster.active;
  } else {
    hasTarget = monsters && monsters.getChildren().some(m => m.active && !m.isBoss && m.x > player.x);
  }
  
  if (isPlayerDead || !hasTarget) return;
  
  const arrow = arrows.create(player.x + 50, player.y - 50, 'arrow');
  arrow.setVelocityX(600);
  arrow.body.setSize(16, 16);
  arrow.setScale(0.5);
  arrow.setDepth(5);
  
  const trail = this.add.circle(arrow.x, arrow.y, 3, 0xffdd66);
  trail.setDepth(4);
  this.tweens.add({
    targets: trail,
    alpha: 0,
    scale: 0.5,
    duration: 200,
    onComplete: () => trail.destroy()
  });
}

function spawnMonster() {
  if (isPlayerDead || isBossBattle) return;
  if (monsters.getChildren().length >= MAX_MONSTERS) return;
  
  const scene = this;
  const monsterType = getMonsterType();
  const isMonster2 = monsterType === 2;
  
  // Выбираем спрайт и анимацию в зависимости от типа монстра
  const textureKey = isMonster2 ? 'monster2' : 'monster';
  const walkAnim = isMonster2 ? 'monster_walk2' : 'monster_walk';
  
  const monster = monsters.create(scene.scale.width, laneY, textureKey);
  monster.setOrigin(0.5, 1);
  monster.setVelocityX(-BASE_MONSTER_SPEED);
  monster.play(walkAnim);
  
  const multipliedHp = Math.floor(BASE_MONSTER_HP * floorMultiplier);
  const multipliedDamage = Math.floor(BASE_MONSTER_DAMAGE * floorMultiplier);
  
  monster.hp = multipliedHp;
  monster.maxHp = multipliedHp;
  monster.damage = multipliedDamage;
  monster.lastAttackTime = 0;
  monster.isWaiting = false;
  monster.isBoss = false;
  monster.monsterType = monsterType; // запоминаем тип для атаки
  monster.setScale(1);
  monster.body.setSize(50, 60);
  monster.body.setOffset(23, 36);
  monster.setImmovable(true);
  monster.setDepth(5);
  
  monster.shadow = scene.add.ellipse(monster.x, monster.y + 5, 50, 15, 0x000000, 0.45);
  monster.shadow.setDepth(4);
  
  monster.hpBarBg = scene.add.rectangle(monster.x, monster.y - 90, 60, 6, 0x000000);
  monster.hpBar = scene.add.rectangle(monster.x, monster.y - 90, 60, 6, 0xff0000);
  monster.hpBarBg.setDepth(6);
  monster.hpBar.setDepth(6);
  
  monster.setScale(0);
  scene.tweens.add({
    targets: monster,
    scale: 1,
    duration: 200,
    ease: 'Back.out',
    onUpdate: (tween, target) => {
      if (monster.shadow) monster.shadow.setScale(target.scaleX, 0.5);
    }
  });
}

function spawnBoss(boss) {
  console.log("spawnBoss вызван", boss);
  
  if (bossMonster) {
    if (bossMonster.hpBar) bossMonster.hpBar.destroy();
    if (bossMonster.hpBarBg) bossMonster.hpBarBg.destroy();
    if (bossMonster.nameText) bossMonster.nameText.destroy();
    if (bossMonster.shadow) bossMonster.shadow.destroy();
    if (monsters) monsters.remove(bossMonster, true, true);
    bossMonster = null;
  }
  
  const scene = this;
  const laneY = scene.scale.height - 40;
  
  // Создаём босса с анимацией
  bossMonster = monsters.create(scene.scale.width, laneY, 'boss_idle');
  bossMonster.setOrigin(0.5, 1);
  bossMonster.setVelocityX(-boss.speed);
  bossMonster.play('boss_walk');
  bossMonster.setScale(1.2);
  
  bossMonster.hp = boss.hp;
  bossMonster.maxHp = boss.hp;
  bossMonster.damage = boss.damage;
  bossMonster.isBoss = true;
  bossMonster.body.setSize(70, 80);
  bossMonster.body.setOffset(29, 48);
  bossMonster.setImmovable(true);
  bossMonster.setDepth(5);
  bossMonster.isWaiting = false;
  bossMonster.lastAttackTime = 0;
  
  bossMonster.shadow = scene.add.ellipse(bossMonster.x, laneY + 8, 80, 20, 0x000000, 0.55);
  bossMonster.shadow.setDepth(4);
  
  bossMonster.hpBarBg = scene.add.rectangle(bossMonster.x, bossMonster.y - 100, 200, 12, 0x000000);
  bossMonster.hpBar = scene.add.rectangle(bossMonster.x, bossMonster.y - 100, 200, 12, 0xff0000);
  bossMonster.hpBarBg.setDepth(6);
  bossMonster.hpBar.setDepth(6);
  
  bossMonster.nameText = scene.add.text(bossMonster.x, bossMonster.y - 120, boss.name, {
    fontSize: '14px',
    color: '#ffaa44',
    fontWeight: 'bold',
    stroke: '#000000',
    strokeThickness: 2
  });
  bossMonster.nameText.setDepth(6);
  
  console.log("Босс создан");
}

function hitEffect(scene, monster) {
  monster.setTint(0xff4444);
  scene.time.delayedCall(100, () => { if (monster.active) monster.clearTint(); });
  scene.tweens.add({ targets: monster, x: monster.x - 10, duration: 50, yoyo: true, repeat: 2 });
}

function showDamage(scene, x, y, value, isCrit) {
  const text = scene.add.text(x, y - 40, value, {
    fontSize: '20px', fontWeight: 'bold', fill: isCrit ? '#ffaa00' : '#ffffff'
  });
  text.setDepth(15);
  if (isCrit) {
    text.setFontSize('32px');
    text.setText('CRITICAL!');
  }
  scene.tweens.add({ targets: text, y: y - 100, alpha: 0, duration: 600, onComplete: () => text.destroy() });
}

function hitMonster(arrow, monster) {
  if (!monster.active) return;
  arrow.destroy();

  let isCrit = false;
  let finalDamage = window.gameState.damage;
  if (Math.random() * 100 < window.gameState.critChance) {
    finalDamage *= window.gameState.critDamage;
    isCrit = true;
  }

  finalDamage = Math.floor(finalDamage);
  monster.hp -= finalDamage;

  hitEffect(this, monster);
  showDamage(this, monster.x, monster.y, finalDamage, isCrit);
  
  if (isCrit) {
    this.cameras.main.shake(100, 0.003);
    this.tweens.add({
      targets: player,
      scale: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  if (monster.hp <= 0) {
    if (monster.hpBar) monster.hpBar.destroy();
    if (monster.hpBarBg) monster.hpBarBg.destroy();
    if (monster.nameText) monster.nameText.destroy();
    if (monster.shadow) monster.shadow.destroy();
    monster.destroy();
    
    if (monster.isBoss) {
      isBossBattle = false;
      bossMonster = null;
      hideBossExitBtn();
      if (typeof window.claimBossReward === 'function') {
        window.claimBossReward(currentBoss.level);
      }
      showToast(`🎉 ПОБЕДА НАД БОССОМ ${currentBoss.name}! 🎉`);
      currentBoss = null;
      if (typeof renderBossUI === 'function') {
        setTimeout(() => renderBossUI(), 500);
      }
    } else {
      window.gameState.kills++;
      
      addExp(10);
      
      // Награда увеличивается каждые 5 этажей
      const floorTier = Math.ceil(currentFloor / 5);
      const reward = floorTier * 0.001;
      
      if (typeof window.addTempCoins === 'function') {
        window.addTempCoins(reward);
      }
      
      if (window.onMonsterKilled) window.onMonsterKilled();
      
      // Эффект взрыва/крови
      for(let i = 0; i < 8; i++) {
        const particle = this.add.circle(monster.x, monster.y, 3, 0xff4444);
        this.tweens.add({
          targets: particle,
          x: monster.x + (Math.random() - 0.5) * 80,
          y: monster.y + (Math.random() - 0.5) * 80,
          alpha: 0,
          scale: 0,
          duration: 500,
          onComplete: () => particle.destroy()
        });
      }
      
      checkAndSpawnNextMonster(this);
    }
  }
}

function monsterAttackPlayer(player, monster) {
  if (isPlayerDead) return;
  
  // Используем разные задержки атаки для обычных монстров и босса
  const attackDelay = monster.isBoss ? BOSS_ATTACK_DELAY : MONSTER_ATTACK_DELAY;
  const currentTime = Date.now();
  
  if (currentTime - monster.lastAttackTime >= attackDelay) {
    monster.lastAttackTime = currentTime;
    
    // Воспроизводим анимацию атаки в зависимости от типа монстра
    if (monster.isBoss) {
      monster.play('boss_attack_anim');
    } else {
      const attackAnim = monster.monsterType === 2 ? 'monster_attack_anim2' : 'monster_attack_anim';
      monster.play(attackAnim);
    }
    
    // Покраснение персонажа
    player.setTint(0xff8888);
    this.time.delayedCall(150, () => { 
      if (player.active) player.clearTint(); 
    });
  }
}

function updateStats() {
  const damageSpan = document.getElementById('statDamageValue');
  if (damageSpan) damageSpan.innerText = window.gameState.damage;
  
  const speedSpan = document.getElementById('statSpeedValue');
  if (speedSpan) speedSpan.innerText = window.gameState.attackSpeed.toFixed(1);
  
  const critChanceSpan = document.getElementById('statCritChanceValue');
  if (critChanceSpan) critChanceSpan.innerText = Math.round(window.gameState.critChance * 10) / 10 + '%';
  
  const critDamageSpan = document.getElementById('statCritDamageValue');
  if (critDamageSpan) critDamageSpan.innerText = '+' + Math.round((window.gameState.critDamage - 1) * 1000) / 10 + '%';
  
  updatePowerDisplay();
  updateFloorUI();
}

// ============= КНОПКА ВЫХОДА =============
function showBossExitBtn() {
  const btn = document.getElementById('bossExitBtn');
  if (btn) {
    btn.style.display = 'flex';
  }
}

function hideBossExitBtn() {
  const btn = document.getElementById('bossExitBtn');
  if (btn) {
    btn.style.display = 'none';
  }
}

function exitBossFight() {
  if (!isBossBattle && !currentBoss) return;
  
  const modal = document.getElementById('confirmModal');
  const message = document.getElementById('confirmMessage');
  
  if (modal && message) {
    message.innerHTML = `
      <div style="margin-bottom: 10px;">⚠️ ВНИМАНИЕ!</div>
      <div>Вы покидаете бой с боссом <span style="color: #ff5252; font-weight: bold;">${currentBoss?.name}</span></div>
      <div style="margin-top: 10px;">Попытка будет засчитана!</div>
      <div style="color: #ffaa44;">Босс исчезнет на 24 часа.</div>
    `;
    
    modal.style.display = 'flex';
    
    const yesBtn = document.getElementById('confirmYesBtn');
    const noBtn = document.getElementById('confirmNoBtn');
    const overlay = modal.querySelector('.confirm-overlay');
    
    const onYes = () => {
      modal.style.display = 'none';
      
      if (typeof window.recordBossAttempt === 'function') {
        window.recordBossAttempt(currentBoss?.level);
      }
      
      if (bossMonster) {
        if (bossMonster.hpBar) bossMonster.hpBar.destroy();
        if (bossMonster.hpBarBg) bossMonster.hpBarBg.destroy();
        if (bossMonster.nameText) bossMonster.nameText.destroy();
        if (bossMonster.shadow) bossMonster.shadow.destroy();
        monsters.remove(bossMonster, true, true);
        bossMonster = null;
      }
      
      isBossBattle = false;
      currentBoss = null;
      hideBossExitBtn();
      
      showToast(`❌ Вы вышли из боя! Попытка засчитана.`, true);
      
      setTimeout(() => {
        if (!isPlayerDead && !isBossBattle && monsters.getChildren().length === 0) {
          const scene = window.gameInstance.scene.scenes[0];
          if (scene) spawnMonster.call(scene);
        }
      }, 500);
      
      if (typeof renderBossUI === 'function') {
        setTimeout(() => renderBossUI(), 500);
      }
      
      cleanup();
    };
    
    const onNo = () => {
      modal.style.display = 'none';
      cleanup();
    };
    
    const cleanup = () => {
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      if (overlay) overlay.removeEventListener('click', onNo);
    };
    
    yesBtn.removeEventListener('click', onYes);
    noBtn.removeEventListener('click', onNo);
    if (overlay) overlay.removeEventListener('click', onNo);
    
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
    if (overlay) overlay.addEventListener('click', onNo);
  }
}

// API для UI
window.gameAPI = {
  updateDamage(value) {
    window.gameState.damage = value;
    updateStats();
  },
  updateAttackSpeed(value) {
    window.gameState.attackSpeed = value;
    updateFireDelay();
    updateStats();
  },
  updateCritChance(value) {
    window.gameState.critChance = value;
    updateStats();
  },
  updateCritDamage(value) {
    window.gameState.critDamage = value;
    updateStats();
  },
  getGameData() {
    return {
      coins: window.gameState.coins,
      kills: window.gameState.kills,
      currentFloor: currentFloor,
      requiredBM: requiredBMForNextFloor,
      currentBM: calculatePower(),
      floorMultiplier: floorMultiplier,
      locations: []
    };
  },
  addCoins(amount) {
    const newCoins = window.gameState.coins + amount;
    if (newCoins >= 0) {
      window.gameState.coins = newCoins;
    } else {
      window.gameState.coins = 0;
    }
    const coinsSpan = document.getElementById('uiCoins');
    if (coinsSpan) coinsSpan.innerText = window.gameState.coins.toFixed(3);
  },
  addKills(amount) {
    window.gameState.kills += amount;
  },
  nextFloor: function() {
    nextFloor();
  },
  prevFloor: function() {
    prevFloor();
  },
  getPlayerLevel: function() {
    return { level: playerLevel, exp: playerExp, nextExp: expToNextLevel };
  },
  getBaseStats: function() {
    const damage = 10 + (playerLevel - 1) * 2;
    const attackSpeed = 1.0 + (playerLevel - 1) * 0.2;
    return {
      damage: damage,
      attackSpeed: parseFloat(attackSpeed.toFixed(1))
    };
  },
  getCurrentFloor: function() {
    return currentFloor;
  },
  updatePowerDisplay: function() {
    updatePowerDisplay();
  },
  getPower: function() {
    return calculatePower();
  },
  clearAllMonsters: function() {
    clearAllMonsters();
  },
  returnToFloor: function() {
    console.log("Возврат на этаж", currentFloor);
    setTimeout(() => {
      if (!isBossBattle && !isPlayerDead && monsters.getChildren().length === 0) {
        const scene = window.gameInstance.scene.scenes[0];
        if (scene) spawnMonster.call(scene);
      }
    }, 100);
  },
  startBossBattle: function(boss) {
    console.log("startBossBattle вызван", boss);
    isBossBattle = true;
    currentBoss = boss;
    
    showBossExitBtn();
    
    if (monsters) {
      const allMonsters = monsters.getChildren();
      for (let i = allMonsters.length - 1; i >= 0; i--) {
        const m = allMonsters[i];
        if (m.hpBar) m.hpBar.destroy();
        if (m.hpBarBg) m.hpBarBg.destroy();
        if (m.shadow) m.shadow.destroy();
        if (m.nameText) m.nameText.destroy();
        m.destroy();
      }
      monsters.clear(true, true);
    }
    
    const scene = window.gameInstance.scene.scenes[0];
    if (scene) {
      spawnBoss.call(scene, boss);
      showToast(`⚔️ БОСС: ${boss.name}! ⚔️`, false);
    } else {
      console.error("Сцена не найдена");
      showToast(`❌ Ошибка: сцена не найдена!`, true);
    }
  },
  addExp: function(amount) {
    addExp(amount);
  }
};



document.addEventListener('DOMContentLoaded', () => {
  const prevBtn = document.getElementById('prevFloorBtn');
  const nextBtn = document.getElementById('nextFloorBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => { if (window.gameAPI) window.gameAPI.prevFloor(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (window.gameAPI) window.gameAPI.nextFloor(); });
});