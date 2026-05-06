// ============= СИСТЕМА БОССОВ =============

const BOSSES = {
    5: {
        name: "Zombie Boss",
        level: 5,
        requiredFloor: 5,
        requiredPlayerLevel: 5,
        power: 500,
        hp: 5000,
        damage: 50,
        speed: 30,
        icon: "boss.png",
        rewards: {
            minCoins: 0.5,
            maxCoins: 0.5,
            exp: 500,
            dropRates: {
                common: 10,
                uncommon: 0.1
            }
        }
    },
    20: {
        name: "Zombie Boss",
        level: 20,
        requiredFloor: 20,
        requiredPlayerLevel: 20,
        power: 2000,
        hp: 15000,
        damage: 120,
        speed: 45,
        icon: "boss.png",
        rewards: {
            minCoins: 0.5,
            maxCoins: 0.5,
            exp: 1500,
            dropRates: {
                common: 10,
                uncommon: 1
            }
        }
    },
    40: {
        name: "Zombie Boss",
        level: 40,
        requiredFloor: 40,
        requiredPlayerLevel: 40,
        power: 5000,
        hp: 45000,
        damage: 250,
        speed: 55,
        icon: "boss.png",
        rewards: {
            minCoins: 0.5,
            maxCoins: 0.5,
            exp: 4000,
            dropRates: {
                uncommon: 5,
                rare: 0.1
            }
        }
    },
    60: {
        name: "Zombie Boss",
        level: 60,
        requiredFloor: 60,
        requiredPlayerLevel: 60,
        power: 10000,
        hp: 100000,
        damage: 500,
        speed: 70,
        icon: "boss.png",
        rewards: {
            minCoins: 0.5,
            maxCoins: 0.5,
            exp: 10000,
            dropRates: {
                epic: 0.001,
                legendary: 0.00001
            }
        }
    }
};

let bossData = {
    lastBossFight: {},
    isFighting: false,
    bossHp: 0,
    bossMaxHp: 0,
    currentBossLevel: null
};

function initBossData() {
    for (const level of Object.keys(BOSSES)) {
        if (bossData.lastBossFight[level] === undefined) {
            bossData.lastBossFight[level] = null;
        }
    }
}

function loadBossData() {
    const saved = localStorage.getItem('bossData');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            bossData.lastBossFight = parsed.lastBossFight || {};
            bossData.isFighting = parsed.isFighting || false;
        } catch(e) {}
    }
    initBossData();
}

function saveBossData() {
    localStorage.setItem('bossData', JSON.stringify(bossData));
}

function getAvailableBosses() {
    const playerLevel = window.gameAPI?.getPlayerLevel()?.level || 1;
    const currentFloor = window.gameAPI?.getCurrentFloor?.() || 1;
    const bosses = [];
    for (const [level, boss] of Object.entries(BOSSES)) {
        bosses.push({ 
            level: parseInt(level), 
            ...boss, 
            isUnlocked: (currentFloor >= boss.requiredFloor && playerLevel >= boss.requiredPlayerLevel)
        });
    }
    return bosses;
}

function canFightBoss(bossLevel) {
    const boss = BOSSES[bossLevel];
    if (!boss) return { available: false, reason: `❌ Босс не найден`, locked: true };
    
    const playerLevel = window.gameAPI?.getPlayerLevel()?.level || 1;
    const currentFloor = window.gameAPI?.getCurrentFloor?.() || 1;
    
    if (playerLevel < boss.requiredPlayerLevel) {
        return { available: false, reason: `⭐ Требуется ${boss.requiredPlayerLevel} уровень`, locked: true };
    }
    
    if (currentFloor < boss.requiredFloor) {
        return { available: false, reason: `🏢 Требуется ${boss.requiredFloor} этаж`, locked: true };
    }
    
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const lastFight = bossData.lastBossFight[bossLevel];
    
    if (lastFight) {
        const timeSince = now - lastFight;
        if (timeSince < day) {
            const hoursLeft = Math.ceil((day - timeSince) / (60 * 60 * 1000));
            return { available: false, reason: `⏰ Доступен через ${hoursLeft} ч`, hoursLeft, locked: false };
        }
    }
    
    return { available: true, reason: null, locked: false };
}

function startBossFight(bossLevel) {
    const boss = BOSSES[bossLevel];
    if (!boss) {
        showToast('❌ Босс не найден!', true);
        return false;
    }
    
    const playerLevel = window.gameAPI?.getPlayerLevel()?.level || 1;
    const currentFloor = window.gameAPI?.getCurrentFloor?.() || 1;
    
    if (playerLevel < boss.requiredPlayerLevel) {
        showToast(`❌ Нужно достичь ${boss.requiredPlayerLevel} уровня!`, true);
        return false;
    }
    
    if (currentFloor < boss.requiredFloor) {
        showToast(`❌ Нужно достичь ${boss.requiredFloor} этажа!`, true);
        return false;
    }
    
    const canFight = canFightBoss(bossLevel);
    if (!canFight.available) {
        showToast(`⚠️ ${canFight.reason}!`, true);
        return false;
    }
    
    bossData.currentBossLevel = bossLevel;
    bossData.isFighting = true;
    bossData.bossHp = boss.hp;
    bossData.bossMaxHp = boss.hp;
    saveBossData();
    
    if (window.gameAPI && window.gameAPI.clearAllMonsters) {
        window.gameAPI.clearAllMonsters();
    }
    
    if (window.gameAPI && window.gameAPI.startBossBattle) {
        window.gameAPI.startBossBattle(boss);
    }
    return true;
}

function claimBossReward(bossLevel) {
    const boss = BOSSES[bossLevel];
    if (!boss) return;
    
    const now = Date.now();
    bossData.lastBossFight[bossLevel] = now;
    bossData.isFighting = false;
    saveBossData();
    
    const coins = boss.rewards.minCoins;
    const exp = boss.rewards.exp;
    
    const dropRates = boss.rewards.dropRates;
    let droppedItem = null;
    
    const roll = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, chance] of Object.entries(dropRates)) {
        cumulative += chance;
        if (roll < cumulative) {
            const possibleItems = ALL_ITEMS.filter(item => item.rarity === rarity);
            if (possibleItems.length > 0) {
                const base = Phaser.Utils.Array.GetRandom(possibleItems);
                droppedItem = {
                    ...base,
                    id: Date.now() + Math.random(),
                    color: getRarityColor(rarity),
                    stats: { ...base.stats, upgradeLevel: 0 }
                };
            }
            break;
        }
    }
    
    if (window.gameAPI) {
        window.gameAPI.addCoins(coins);
        if (window.gameAPI.addExp) window.gameAPI.addExp(exp);
    }
    
    if (droppedItem) {
        inventory.push(droppedItem);
        if (typeof updateInventoryUI === 'function') {
            updateInventoryUI();
        }
    }
    
    showBossVictoryModal(boss, droppedItem, coins, exp);
    
    if (typeof renderBossUI === 'function') {
        renderBossUI();
    }
}

function showBossVictoryModal(boss, item, coins, exp) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 320px;
        max-width: 90vw;
        background: linear-gradient(135deg, #1a1d2e, #121520);
        border: 2px solid #ffd54f;
        border-radius: 20px;
        padding: 20px;
        z-index: 200;
        text-align: center;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
        animation: bounceIn 0.3s ease;
    `;
    
    let itemHtml = '';
    if (item) {
        let rarityClass = '';
        if (item.rarity === 'common') rarityClass = 'common-glow';
        else if (item.rarity === 'uncommon') rarityClass = 'uncommon-glow';
        else if (item.rarity === 'rare') rarityClass = 'rare-glow';
        else if (item.rarity === 'epic') rarityClass = 'epic-glow';
        else if (item.rarity === 'legendary') rarityClass = 'legendary-glow';
        
        itemHtml = `
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;"></div>
            <div>🎁 ВЫПАЛ ПРЕДМЕТ!</div>
            <div style="margin: 10px 0;">
                <img src="${item.iconImg}" class="${rarityClass}" style="width: 60px; height: 60px; border-radius: 10px; border: 2px solid ${item.color};">
                <div style="font-size: 12px; color: ${item.color}">${item.name}</div>
            </div>
        `;
    } else {
        itemHtml = `<div style="margin: 10px 0; color: #aaa;">😔 Предмет не выпал...</div>`;
    }
    
    modal.innerHTML = `
        <div style="font-size: 24px;">🎉 ПОБЕДА! 🎉</div>
        <div style="font-size: 18px; color: #ffd54f; margin: 10px 0;">${boss.name}</div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 10px 0;"></div>
        <div>💰 +${coins.toFixed(3)} монет</div>
        <div>⭐ +${exp} опыта</div>
        ${itemHtml}
        <button id="closeRewardBtn" style="margin-top: 15px; background: #ffd54f; border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer; font-weight: bold; width: 100%; color: #1a1a2e;">🏠 ВЕРНУТЬСЯ НА ЭТАЖ</button>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeRewardBtn').onclick = () => {
        modal.remove();
        if (window.gameAPI && window.gameAPI.returnToFloor) {
            window.gameAPI.returnToFloor();
        }
    };
}

function getRewardIcons(boss) {
    if (boss.level === 5) {
        const commonItems = ALL_ITEMS.filter(item => item.rarity === 'common');
        const shuffled = [...commonItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 6);
    }
    
    if (boss.level === 20) {
        const uncommonItems = ALL_ITEMS.filter(item => item.rarity === 'uncommon');
        const shuffled = [...uncommonItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 6);
    }
    
    if (boss.level === 40) {
        const rareItems = ALL_ITEMS.filter(item => item.rarity === 'rare');
        const shuffled = [...rareItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 6);
    }
    
    if (boss.level === 60) {
        const epicItems = ALL_ITEMS.filter(item => item.rarity === 'epic');
        const legendaryItems = ALL_ITEMS.filter(item => item.rarity === 'legendary');
        const allItems = [...epicItems, ...legendaryItems];
        const shuffled = [...allItems];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 6);
    }
    
    return [];
}

function renderBossUI() {
    const container = document.getElementById('bossList');
    if (!container) {
        console.log("bossList не найден");
        return;
    }
    
    const allBosses = getAvailableBosses();
    const playerPower = window.gameAPI?.getPower?.() || 0;
    const playerLevel = window.gameAPI?.getPlayerLevel()?.level || 1;
    const currentFloor = window.gameAPI?.getCurrentFloor?.() || 1;
    
    container.innerHTML = '';
    
    allBosses.sort((a, b) => a.level - b.level);
    
    allBosses.forEach(boss => {
        const canFight = canFightBoss(boss.level);
        const isUnlocked = boss.isUnlocked;
        const rewardIcons = getRewardIcons(boss);
        
        const div = document.createElement('div');
        div.className = 'boss-item';
        
        let borderColor = '#555';
        let opacity = '0.6';
        let lockHtml = '';
        
        if (!isUnlocked) {
            borderColor = '#ff5252';
            lockHtml = '<div style="position: absolute; top: 10px; right: 15px; font-size: 24px;">🔒</div>';
        } else if (!canFight.available && canFight.reason) {
            borderColor = '#ffd54f';
            opacity = '0.7';
        } else {
            borderColor = '#4caf50';
            opacity = '1';
        }
        
        div.style.cssText = `
            background: rgba(0,0,0,0.3);
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid ${borderColor};
            opacity: ${opacity};
            position: relative;
            transition: 0.2s;
        `;
        
        let powerColor = '#aaa';
        if (playerPower > boss.power * 1.5) powerColor = '#4caf50';
        else if (playerPower > boss.power) powerColor = '#ffd54f';
        else powerColor = '#ff5252';
        
        let rewardsIconsHtml = '<div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">';
        rewardIcons.forEach(item => {
            let rarityClass = '';
            if (item.rarity === 'common') rarityClass = 'common-glow';
            else if (item.rarity === 'uncommon') rarityClass = 'uncommon-glow';
            else if (item.rarity === 'rare') rarityClass = 'rare-glow';
            else if (item.rarity === 'epic') rarityClass = 'epic-glow';
            else if (item.rarity === 'legendary') rarityClass = 'legendary-glow';
            
            rewardsIconsHtml += `
                <div style="position: relative; width: 36px; height: 36px;">
                    <img src="${item.iconImg}" class="${rarityClass}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; border: 2px solid ${item.color};">
                </div>
            `;
        });
        rewardsIconsHtml += '</div>';
        
        let actionButton = '';
        if (!isUnlocked) {
            let lockReason = '';
            if (playerLevel < boss.requiredPlayerLevel) {
                lockReason = `🔒 ТРЕБУЕТСЯ ${boss.requiredPlayerLevel} УРОВЕНЬ`;
            } else if (currentFloor < boss.requiredFloor) {
                lockReason = `🔒 ТРЕБУЕТСЯ ${boss.requiredFloor} ЭТАЖ`;
            } else {
                lockReason = `🔒 ЗАБЛОКИРОВАН`;
            }
            actionButton = `<div style="text-align: center;">
                <div style="font-size: 11px; color: #ff5252;">${lockReason}</div>
            </div>`;
        } else if (!canFight.available && canFight.reason) {
            actionButton = `<div style="text-align: center;">
                <div style="font-size: 11px; color: #ffd54f;">${canFight.reason}</div>
            </div>`;
        } else {
            actionButton = `<button class="boss-fight-btn" data-level="${boss.level}" style="background: #4caf50; border: none; padding: 8px 16px; border-radius: 30px; cursor: pointer; font-weight: bold; color: white; font-size: 12px;">⚔️ БИТВА</button>`;
        }
        
        div.innerHTML = `
            ${lockHtml}
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <div style="min-width: 55px; text-align: center;">
                    <img src="${boss.icon}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 10px;">
                </div>
                <div style="flex: 1; min-width: 180px;">
                    <div style="font-size: 15px; font-weight: bold; color: #ffd54f;">${boss.name} ${boss.level} lvl</div>
                    <div style="font-size: 10px; color: ${powerColor};">⚡ Рек. мощь: ${boss.power.toLocaleString()}</div>
                    <div style="font-size: 10px; color: #ffd54f;">💰 ${boss.rewards.minCoins.toFixed(3)} монет | ⭐ +${boss.rewards.exp} опыта</div>
                    ${rewardsIconsHtml}
                </div>
                <div>
                    ${actionButton}
                </div>
            </div>
        `;
        
        container.appendChild(div);
    });
    
    document.querySelectorAll('.boss-fight-btn').forEach(btn => {
        btn.onclick = () => {
            const level = parseInt(btn.dataset.level);
            startBossFight(level);
        };
    });
}

function recordBossAttempt(bossLevel) {
    const now = Date.now();
    bossData.lastBossFight[bossLevel] = now;
    saveBossData();
    console.log(`Попытка боя с боссом ${bossLevel} уровня засчитана в ${new Date(now).toLocaleString()}`);
    if (typeof renderBossUI === 'function') {
        renderBossUI();
    }
}

loadBossData();
window.renderBossUI = renderBossUI;
window.getAvailableBosses = getAvailableBosses;
window.canFightBoss = canFightBoss;
window.claimBossReward = claimBossReward;
window.recordBossAttempt = recordBossAttempt;

console.log("boss.js загружен");