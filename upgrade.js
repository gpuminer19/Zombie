// ============= УЛУЧШЕНИЕ ПРЕДМЕТОВ =============
let upgradeModal = null;
let upgradeItem = null;
let sellPriceModal = null;
let sellItemObj = null;

// Специальные бонусы за уровни заточки
const MILESTONE_BONUSES = {
    5: { name: "Атака +5", stat: "damage", value: 5, icon: "⚔️" },
    7: { name: "Крит урон +10%", stat: "critDamage", value: 10, icon: "💢" },
    10: { name: "Скорость атаки +0.5", stat: "attackSpeed", value: 0.5, icon: "⚡" },
    12: { name: "Двойное выпадение предметов", stat: "doubleDrop", value: true, icon: "🎁" }
};

function createUpgradeModal() {
    if (upgradeModal) return;
    upgradeModal = document.createElement('div');
    upgradeModal.id = 'upgradeModal';
    upgradeModal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 360px; background: #1e2530; border-radius: 20px; padding: 20px;
        z-index: 110; border: 1px solid #ffd54f; display: none;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    `;
    upgradeModal.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 18px; font-weight: bold; color: #ffd54f;">🔧 УЛУЧШЕНИЕ</div>
        </div>
        <div id="upgradeItemInfo" style="text-align: center; margin-bottom: 10px; font-size: 13px;"></div>
        
        <div id="upgradeLevelDisplay" style="text-align: center; margin-bottom: 15px;"></div>
        
        <div id="statsCompare" style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 10px; margin-bottom: 15px;"></div>
        
        <div style="margin: 10px 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 12px;">
            <div style="font-size: 9px; color: #aaa; text-align: center; margin-bottom: 8px;">✨ ОСОБЫЕ БОНУСЫ ЗА ЗАТОЧКУ ✨</div>
            <div id="milestoneBonuses" style="display: flex; flex-direction: column; gap: 5px;"></div>
        </div>
        
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 12px; color: #aaa;">Шанс улучшения</div>
            <div style="font-size: 28px; font-weight: bold; color: #ffd54f;" id="upgradeChance">100%</div>
        </div>
        <div style="text-align: center; margin-bottom: 15px; font-size: 10px; color: #ff6666;">⚠️ Внимание! При неудаче предмет исчезнет</div>
        <div style="display: flex; gap: 10px;">
            <button id="upgradeConfirmBtn" style="flex: 1; background: #ffd54f; color: #1a1a2e; border: none; padding: 10px; border-radius: 30px; font-weight: bold; cursor: pointer;">УЛУЧШИТЬ (1💰)</button>
            <button id="upgradeCloseBtn" style="flex: 1; background: #333; color: white; border: none; padding: 10px; border-radius: 30px; cursor: pointer;">ЗАКРЫТЬ</button>
        </div>
    `;
    document.body.appendChild(upgradeModal);
    
    const confirmBtn = document.getElementById('upgradeConfirmBtn');
    const closeBtn = document.getElementById('upgradeCloseBtn');
    if (confirmBtn) confirmBtn.onclick = () => confirmUpgrade();
    if (closeBtn) closeBtn.onclick = () => closeUpgradeModal();
}

function calculateStatsAfterUpgrade(item) {
    const currentStats = { ...item.stats };
    const newStats = { ...item.stats };
    
    for (let key in newStats) {
        if (key !== 'upgradeLevel' && key !== 'doubleDrop' && typeof newStats[key] === 'number') {
            newStats[key] = parseFloat((newStats[key] * 1.1).toFixed(2));
        }
    }
    
    const nextLevel = (item.stats.upgradeLevel || 0) + 1;
    if (MILESTONE_BONUSES[nextLevel]) {
        const bonus = MILESTONE_BONUSES[nextLevel];
        if (bonus.stat === 'damage') {
            newStats.damage = (newStats.damage || 0) + bonus.value;
        } else if (bonus.stat === 'critDamage') {
            newStats.critDamage = (newStats.critDamage || 0) + bonus.value;
        } else if (bonus.stat === 'attackSpeed') {
            newStats.attackSpeed = (newStats.attackSpeed || 0) + bonus.value;
        }
    }
    
    return newStats;
}

function renderStatsCompare(item, afterStats) {
    const container = document.getElementById('statsCompare');
    if (!container) return;
    
    const statNames = {
        damage: '💥 Урон',
        attackSpeed: '⚡ Скорость атаки',
        critChance: '🎯 Шанс крита',
        critDamage: '💢 Крит урон'
    };
    
    let html = '<div style="font-size: 10px; color: #aaa; text-align: center; margin-bottom: 8px;">📊 ХАРАКТЕРИСТИКИ</div>';
    
    for (let [key, name] of Object.entries(statNames)) {
        const currentValue = item.stats[key];
        const afterValue = afterStats[key];
        
        if (currentValue !== undefined) {
            let currentDisplay, afterDisplay;
            
            if (key === 'attackSpeed') {
                currentDisplay = `+${currentValue.toFixed(1)} выстр/с`;
                afterDisplay = `+${afterValue.toFixed(1)} выстр/с`;
            } else if (key === 'critChance' || key === 'critDamage') {
                currentDisplay = `+${currentValue}%`;
                afterDisplay = `+${afterValue}%`;
            } else {
                currentDisplay = `+${currentValue}`;
                afterDisplay = `+${afterValue}`;
            }
            
            const hasChange = currentValue !== afterValue;
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="font-size: 11px; color: #aaa;">${name}</span>
                    <div>
                        <span style="font-size: 11px; color: #ddd;">${currentDisplay}</span>
                        ${hasChange ? `<span style="font-size: 11px; color: #ffd54f; margin: 0 5px;">→</span><span style="font-size: 11px; color: #4caf50; font-weight: bold;">${afterDisplay}</span>` : ''}
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

function updateMilestoneDisplay(currentLevel) {
    const container = document.getElementById('milestoneBonuses');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [level, bonus] of Object.entries(MILESTONE_BONUSES)) {
        const isUnlocked = currentLevel >= parseInt(level);
        const bonusDiv = document.createElement('div');
        bonusDiv.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            background: ${isUnlocked ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 10px;
            border-left: 3px solid ${isUnlocked ? '#ffd54f' : '#555'};
            opacity: ${isUnlocked ? '1' : '0.5'};
            transition: 0.2s;
        `;
        
        bonusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px;">${bonus.icon}</span>
                <span style="font-size: 11px; color: ${isUnlocked ? '#ffd54f' : '#aaa'};">${bonus.name}</span>
            </div>
            <div style="font-size: 10px; color: ${isUnlocked ? '#ffd54f' : '#666'};">
                ${isUnlocked ? '✅ АКТИВИРОВАН' : `🔒 ТРЕБУЕТСЯ +${level}`}
            </div>
        `;
        
        container.appendChild(bonusDiv);
    }
}

function createSellPriceModal() {
    if (sellPriceModal) return;
    sellPriceModal = document.createElement('div');
    sellPriceModal.id = 'sellPriceModal';
    sellPriceModal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 280px; background: #1e2530; border-radius: 20px; padding: 20px;
        z-index: 110; border: 1px solid #ffd54f; display: none;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    `;
    sellPriceModal.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 18px; font-weight: bold; color: #ffd54f;">💰 ВЫСТАВИТЬ НА РЫНОК</div>
        </div>
        <div id="sellItemInfo" style="text-align: center; margin-bottom: 15px; font-size: 13px;"></div>
        <div style="margin-bottom: 15px;">
            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">Укажите цену:</div>
            <input type="number" id="itemPrice" style="width: 100%; padding: 10px; border-radius: 12px; border: 1px solid #ffd54f; background: #2a2a2e; color: white; font-size: 16px;" placeholder="Цена в монетах" value="1000">
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="sellConfirmBtn" style="flex: 1; background: #ffd54f; color: #1a1a2e; border: none; padding: 10px; border-radius: 30px; font-weight: bold; cursor: pointer;">ВЫСТАВИТЬ</button>
            <button id="sellPriceCloseBtn" style="flex: 1; background: #333; color: white; border: none; padding: 10px; border-radius: 30px; cursor: pointer;">ОТМЕНА</button>
        </div>
    `;
    document.body.appendChild(sellPriceModal);
    
    const confirmBtn = document.getElementById('sellConfirmBtn');
    const closeBtn = document.getElementById('sellPriceCloseBtn');
    if (confirmBtn) confirmBtn.onclick = () => confirmSellOnMarket();
    if (closeBtn) closeBtn.onclick = () => closeSellPriceModal();
}

function openUpgradeModal(item) {
    console.log('openUpgradeModal вызван для:', item?.name);
    if (!item) {
        showToast('❌ Предмет не найден', true);
        return;
    }
    createUpgradeModal();
    upgradeItem = item;
    const currentLevel = item.stats?.upgradeLevel || 0;
    const nextLevel = currentLevel + 1;
    const successChance = Math.max(5, 100 - currentLevel * 5);
    
    const itemInfo = document.getElementById('upgradeItemInfo');
    if (itemInfo) {
        itemInfo.innerHTML = `<div style="color: ${item.color}">${item.name}</div>`;
    }
    
    const levelDisplay = document.getElementById('upgradeLevelDisplay');
    if (levelDisplay) {
        levelDisplay.innerHTML = `
            <div style="display: inline-flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.4); padding: 6px 16px; border-radius: 30px;">
                <span style="font-size: 14px; color: #aaa;">УРОВЕНЬ</span>
                <span style="font-size: 20px; font-weight: bold; color: #ffd54f;">+${currentLevel}</span>
                <span style="font-size: 16px; color: #aaa;">→</span>
                <span style="font-size: 20px; font-weight: bold; color: #4caf50;">+${nextLevel}</span>
            </div>
        `;
    }
    
    const afterStats = calculateStatsAfterUpgrade(item);
    renderStatsCompare(item, afterStats);
    
    const chanceSpan = document.getElementById('upgradeChance');
    if (chanceSpan) chanceSpan.innerHTML = successChance + '%';
    
    updateMilestoneDisplay(currentLevel);
    
    if (upgradeModal) upgradeModal.style.display = 'block';
}

function closeUpgradeModal() {
    if (upgradeModal) upgradeModal.style.display = 'none';
    upgradeItem = null;
}

function applyMilestoneBonus(item, newLevel) {
    const bonus = MILESTONE_BONUSES[newLevel];
    if (!bonus) return false;
    
    if (bonus.stat === 'damage') {
        item.stats.damage = (item.stats.damage || 0) + bonus.value;
        showToast(`✨ БОНУС! ${bonus.name} активирован! ✨`);
    } else if (bonus.stat === 'critDamage') {
        item.stats.critDamage = (item.stats.critDamage || 0) + bonus.value;
        showToast(`✨ БОНУС! ${bonus.name} активирован! ✨`);
    } else if (bonus.stat === 'attackSpeed') {
        item.stats.attackSpeed = (item.stats.attackSpeed || 0) + bonus.value;
        showToast(`✨ БОНУС! ${bonus.name} активирован! ✨`);
    } else if (bonus.stat === 'doubleDrop') {
        item.stats.doubleDrop = true;
        showToast(`✨ БОНУС! ${bonus.name} активирован! ✨`);
    }
    
    return true;
}

function confirmUpgrade() {
    if (!upgradeItem) {
        showToast('❌ Предмет не найден', true);
        return;
    }
    
    // Стоимость улучшения - 1 монета
    if (window.gameState.coins < 1) {
        showToast('❌ Нужна 1 монета для улучшения!', true);
        return;
    }
    
    const currentLevel = upgradeItem.stats.upgradeLevel || 0;
    const successChance = Math.max(5, 100 - currentLevel * 5);
    const isSuccess = Math.random() * 100 < successChance;
    
    // Снимаем 1 монету
    window.gameState.coins -= 1;
    const coinsSpan = document.getElementById('uiCoins');
    if (coinsSpan) coinsSpan.innerText = window.gameState.coins.toFixed(3);
    
    if (isSuccess) {
        const newLevel = currentLevel + 1;
        upgradeItem.stats.upgradeLevel = newLevel;
        
        for (let key in upgradeItem.stats) {
            if (key !== 'upgradeLevel' && key !== 'doubleDrop' && typeof upgradeItem.stats[key] === 'number') {
                const increase = upgradeItem.stats[key] * 0.1;
                upgradeItem.stats[key] = parseFloat((upgradeItem.stats[key] + increase).toFixed(2));
            }
        }
        
        if (MILESTONE_BONUSES[newLevel]) {
            applyMilestoneBonus(upgradeItem, newLevel);
        }
        
        showToast(`✅ Улучшение успешно! Предмет теперь +${newLevel}`);
        if (typeof updateInventoryUI === 'function') updateInventoryUI();
        if (typeof updateSlots === 'function') updateSlots();
        const isEquipped = equipped[upgradeItem.type] && equipped[upgradeItem.type].id === upgradeItem.id;
        if (isEquipped && typeof applyEquipmentStats === 'function') applyEquipmentStats();
    } else {
        showToast(`💥 Улучшение не удалось! Предмет ${upgradeItem.name} уничтожен!`, true);
        const index = inventory.findIndex(i => i.id === upgradeItem.id);
        if (index !== -1) inventory.splice(index, 1);
        const type = upgradeItem.type;
        if (equipped[type] && equipped[type].id === upgradeItem.id) {
            equipped[type] = null;
            if (typeof applyEquipmentStats === 'function') applyEquipmentStats();
        }
        if (typeof updateInventoryUI === 'function') updateInventoryUI();
        if (typeof updateSlots === 'function') updateSlots();
    }
    closeUpgradeModal();
}

function openSellPriceModal(item) {
    console.log('openSellPriceModal вызван для:', item?.name);
    if (!item) {
        showToast('❌ Предмет не найден', true);
        return;
    }
    createSellPriceModal();
    sellItemObj = item;
    const itemInfo = document.getElementById('sellItemInfo');
    if (itemInfo) {
        itemInfo.innerHTML = `<div style="color: ${item.color}">${item.name}</div><div style="font-size: 11px; color: #aaa;">Редкость: ${item.rarity}</div><div style="font-size: 11px; color: #aaa;">Уровень: +${item.stats.upgradeLevel || 0}</div>`;
    }
    const priceInput = document.getElementById('itemPrice');
    if (priceInput) {
        priceInput.value = Math.floor(100 * (item.stats.upgradeLevel || 0) + 500);
    }
    if (sellPriceModal) sellPriceModal.style.display = 'block';
}

function closeSellPriceModal() {
    if (sellPriceModal) sellPriceModal.style.display = 'none';
    sellItemObj = null;
}

function confirmSellOnMarket() {
    if (!sellItemObj) {
        showToast('❌ Предмет не найден', true);
        return;
    }
    const priceInput = document.getElementById('itemPrice');
    const price = priceInput ? parseInt(priceInput.value) : 0;
    if (isNaN(price) || price < 10) {
        showToast(`❌ Укажите корректную цену (минимум 10 монет)`, true);
        return;
    }
    const marketItem = {
        ...JSON.parse(JSON.stringify(sellItemObj)),
        id: Date.now() + Math.random(),
        sellerPrice: price,
        sellerName: "Игрок",
        listedAt: Date.now()
    };
    marketItems.push(marketItem);
    userListings.push(marketItem.id);
    const index = inventory.findIndex(i => i.id === sellItemObj.id);
    if (index !== -1) inventory.splice(index, 1);
    const type = sellItemObj.type;
    if (equipped[type] && equipped[type].id === sellItemObj.id) {
        equipped[type] = null;
        if (typeof applyEquipmentStats === 'function') applyEquipmentStats();
    }
    if (typeof updateInventoryUI === 'function') updateInventoryUI();
    if (typeof updateSlots === 'function') updateSlots();
    if (typeof renderMarket === 'function') renderMarket();
    showToast(`✅ Предмет ${sellItemObj.name} выставлен на рынок за ${price} монет!`);
    closeSellPriceModal();
}

window.openUpgradeModal = openUpgradeModal;
window.openSellPriceModal = openSellPriceModal;
window.confirmUpgrade = confirmUpgrade;
window.confirmSellOnMarket = confirmSellOnMarket;

console.log('✅ upgrade.js загружен');