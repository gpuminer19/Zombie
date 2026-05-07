// ============= ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ UI =============

// Временное хранилище монет
let tempCoins = 0;

// Telegram Web App
let tg = null;
let tgUser = null;

// URL бэкенда (ТВОЙ ДОМЕН)
const BACKEND_URL = 'https://zombieserv-production.up.railway.app';

// Функция добавления монет во временное хранилище
function addTempCoins(amount) {
    tempCoins += amount;
    updateCollectButton();
    console.log(`Добавлено ${amount} монет во временное хранилище. Всего: ${tempCoins.toFixed(3)}`);
}

// Обновление кнопки сбора
function updateCollectButton() {
    const btn = document.getElementById('collectCoinsBtn');
    const amountSpan = document.getElementById('collectCoinsAmount');
    
    if (btn && amountSpan) {
        amountSpan.innerText = tempCoins.toFixed(3);
        
        const currentTab = document.querySelector('.nav-item.active')?.dataset.tab;
        
        if (currentTab === 'game') {
            btn.style.display = 'flex';
            btn.style.opacity = tempCoins > 0 ? '1' : '0.5';
            btn.disabled = tempCoins <= 0;
        } else {
            btn.style.display = 'none';
        }
    }
}

// Сбор монет в основной баланс
function collectCoins() {
    if (tempCoins <= 0) {
        showToast('😅 Нет монет для сбора! Убивайте монстров!');
        return;
    }
    
    window.gameState.coins += tempCoins;
    
    const coinsSpan = document.getElementById('uiCoins');
    if (coinsSpan) coinsSpan.innerText = window.gameState.coins.toFixed(3);
    if (window.coinText) window.coinText.setText('💰 ' + window.gameState.coins.toFixed(3));
    
    showToast(`💰 Вы собрали ${tempCoins.toFixed(3)} монет!`);
    
    tempCoins = 0;
    
    const btn = document.getElementById('collectCoinsBtn');
    const amountSpan = document.getElementById('collectCoinsAmount');
    
    if (btn && amountSpan) {
        amountSpan.innerText = '0';
        btn.style.opacity = '0.5';
        btn.disabled = true;
    }
    
    // Сохраняем монеты на сервер
    saveCoinsToCloud();
}

function updateLocationUI() {
    const list = document.getElementById('locationList');
    if (!list || !window.gameAPI) return;
    const data = window.gameAPI.getGameData();
    list.innerHTML = '';
    data.locations.forEach((loc, index) => {
        const div = document.createElement('div');
        div.className = 'location-item';
        const isCurrent = index === data.currentLocation;
        const requiredFloor = (index + 1) * 10;
        const unlocked = index === 0 || (data.currentFloor >= requiredFloor);
        let text = `${loc.name}\n👹 HP: ${Math.floor(loc.monsterHp * data.floorMultiplier)}`;
        if (isCurrent) { div.classList.add('active'); text += '\n⭐ Текущая'; }
        if (!unlocked) { div.classList.add('locked'); text += `\n🔒 Откроется после ${requiredFloor} этажа`; }
        else { div.onclick = () => window.gameAPI.changeLocation(index); }
        div.innerText = text;
        list.appendChild(div);
    });
}

// Инициализация Telegram Web App и получение данных пользователя
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            tgUser = tg.initDataUnsafe.user;
            window.tgUser = tgUser;
            
            let playerName = tgUser.first_name || tgUser.username || 'БОЕЦ';
            if (tgUser.last_name) {
                playerName = tgUser.first_name + ' ' + tgUser.last_name;
            }
            localStorage.setItem('playerName', playerName);
            
            const nameSpan = document.getElementById('playerName');
            if (nameSpan) nameSpan.innerText = playerName;
            
            console.log('Telegram пользователь:', tgUser);
            
            // Загружаем сохранение из облака
            setTimeout(() => {
                loadFromCloud();
            }, 500);
        } else {
            console.log('Данные пользователя не получены');
        }
        
        if (tg.themeParams.bg_color) {
            document.body.style.backgroundColor = tg.themeParams.bg_color;
        }
        
        tg.BackButton.hide();
        
        console.log("Telegram Web App инициализирован");
    } else {
        console.log('Telegram Web App не обнаружен');
    }
    
    // Обновляем аватары после инициализации
    setTimeout(updateAvatars, 500);
}

window.onGameReady = function() {
    updateSlots();
    updateLocationUI();
    if (typeof initShop === 'function') initShop();
    if (typeof renderShop === 'function') renderShop();
    const savedMarket = localStorage.getItem('marketItems');
    if (savedMarket) {
        try {
            marketItems = JSON.parse(savedMarket);
            userListings = [];
        } catch(e) {}
    }
    if (typeof renderMarket === 'function') renderMarket();
    if (typeof applyEquipmentStats === 'function') applyEquipmentStats();
    updateCollectButton();
};

window.onMonsterKilled = function() { 
    updateLocationUI(); 
    saveProgressToCloud();
};

window.onDropItem = function() { 
    dropItem(); 
    saveProgressToCloud();
};

window.onLocationChanged = function() { updateLocationUI(); };

window.addTempCoins = addTempCoins;
window.collectCoins = collectCoins;

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isError ? '#ff5252' : '#4caf50'};
        color: white;
        padding: 8px 16px;
        border-radius: 30px;
        font-size: 12px;
        z-index: 200;
        animation: fadeOut 2s forwards;
        white-space: nowrap;
        max-width: 90%;
        white-space: normal;
        text-align: center;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

window.showToast = showToast;

function setCurrentTab(tab) {
    if (tab === 'game') {
        setTimeout(function() {
            updateCollectButton();
        }, 50);
    } else {
        saveProgressToCloud();
    }
}

window.setCurrentTab = setCurrentTab;
window.updateCollectButton = updateCollectButton;

// ============= УПРАВЛЕНИЕ АВАТАРАМИ =============

function updateAvatars() {
    console.log('updateAvatars вызвана');
    
    const topAvatar = document.getElementById('tgAvatar');
    if (topAvatar) {
        if (window.tgUser && window.tgUser.photo_url) {
            topAvatar.src = window.tgUser.photo_url;
            console.log('Верхний аватар: фото из Telegram');
        } else {
            topAvatar.src = 'avatar.png';
            console.log('Верхний аватар: avatar.png');
        }
    }
    
    const invAvatar = document.getElementById('playerAvatar');
    if (invAvatar) {
        invAvatar.src = 'avatar.png';
        console.log('Аватар инвентаря: avatar.png');
    }
}

// ============= ОБЛАЧНОЕ СОХРАНЕНИЕ =============

// Сохранение монет на сервер
async function saveCoinsToCloud() {
    if (!window.tgUser || !window.tgUser.id) return;
    
    try {
        await fetch(`${BACKEND_URL}/api/coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: window.tgUser.id.toString(),
                coins: window.gameState.coins
            })
        });
        console.log('💰 Монеты сохранены');
    } catch(e) {
        console.error('Ошибка сохранения монет:', e);
    }
}

// Сохранение всего прогресса (кроме монет)
async function saveProgressToCloud() {
    if (!window.tgUser || !window.tgUser.id) return;
    
    const saveData = {
        damage: window.gameState.damage,
        attackSpeed: window.gameState.attackSpeed,
        critChance: window.gameState.critChance,
        critDamage: window.gameState.critDamage,
        kills: window.gameState.kills,
        currentFloor: typeof currentFloor !== 'undefined' ? currentFloor : 1,
        floorMultiplier: typeof floorMultiplier !== 'undefined' ? floorMultiplier : 1,
        playerLevel: typeof playerLevel !== 'undefined' ? playerLevel : 1,
        playerExp: typeof playerExp !== 'undefined' ? playerExp : 0,
        expToNextLevel: typeof expToNextLevel !== 'undefined' ? expToNextLevel : 100,
        inventory: inventory || [],
        equipped: equipped || {}
    };
    
    try {
        await fetch(`${BACKEND_URL}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: window.tgUser.id.toString(),
                save_data: saveData
            })
        });
        console.log('💾 Прогресс сохранён');
    } catch(e) {
        console.error('Ошибка сохранения:', e);
    }
}

// Загрузка всего прогресса
async function loadFromCloud() {
    if (!window.tgUser || !window.tgUser.id) return false;
    
    try {
        // Загружаем прогресс
        const response = await fetch(`${BACKEND_URL}/api/load`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: window.tgUser.id.toString()
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.save_data) {
            const data = result.save_data;
            
            // Восстанавливаем данные
            window.gameState.damage = data.damage || 10;
            window.gameState.attackSpeed = data.attackSpeed || 1.0;
            window.gameState.critChance = data.critChance || 0;
            window.gameState.critDamage = data.critDamage || 1.5;
            window.gameState.kills = data.kills || 0;
            
            if (typeof currentFloor !== 'undefined') currentFloor = data.currentFloor || 1;
            if (typeof floorMultiplier !== 'undefined') floorMultiplier = data.floorMultiplier || 1;
            if (typeof playerLevel !== 'undefined') playerLevel = data.playerLevel || 1;
            if (typeof playerExp !== 'undefined') playerExp = data.playerExp || 0;
            if (typeof expToNextLevel !== 'undefined') expToNextLevel = data.expToNextLevel || 100;
            
            if (data.inventory) inventory = data.inventory;
            if (data.equipped) equipped = data.equipped;
            
            // Обновляем UI
            if (typeof updateFloorUI === 'function') updateFloorUI();
            if (typeof updateLevelUI === 'function') updateLevelUI();
            if (typeof updateStats === 'function') updateStats();
            if (typeof updateInventoryUI === 'function') updateInventoryUI();
            if (typeof updateSlots === 'function') updateSlots();
            if (typeof applyEquipmentStats === 'function') applyEquipmentStats();
            if (typeof updatePowerDisplay === 'function') updatePowerDisplay();
            
            console.log('✅ Загружено из облака');
            showToast('☁️ Прогресс загружен!', false);
            return true;
        }
        
        // Загружаем монеты отдельно
        const coinsResponse = await fetch(`${BACKEND_URL}/api/coins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: window.tgUser.id.toString()
            })
        });
        
        const coinsResult = await coinsResponse.json();
        if (coinsResult.success && coinsResult.coins !== undefined) {
            window.gameState.coins = coinsResult.coins;
            const coinsSpan = document.getElementById('uiCoins');
            if (coinsSpan) coinsSpan.innerText = window.gameState.coins.toFixed(3);
            console.log('💰 Монеты загружены:', window.gameState.coins);
        }
        
        return true;
    } catch(e) {
        console.error('❌ Ошибка загрузки:', e);
        return false;
    }
}

// Сохраняем при экипировке/снятии
const originalEquipItem = window.equipItem;
if (originalEquipItem) {
    window.equipItem = function(item) {
        originalEquipItem(item);
        saveProgressToCloud();
    };
}

const originalUnequipItem = window.unequipItem;
if (originalUnequipItem) {
    window.unequipItem = function(type) {
        originalUnequipItem(type);
        saveProgressToCloud();
    };
}

// Сохраняем при смене этажа
const originalNextFloor = window.gameAPI?.nextFloor;
if (originalNextFloor) {
    window.gameAPI.nextFloor = function() {
        originalNextFloor();
        setTimeout(() => saveProgressToCloud(), 100);
    };
}

const originalPrevFloor = window.gameAPI?.prevFloor;
if (originalPrevFloor) {
    window.gameAPI.prevFloor = function() {
        originalPrevFloor();
        setTimeout(() => saveProgressToCloud(), 100);
    };
}

// Автосохранение раз в 2 минуты
setInterval(() => {
    if (window.tgUser && window.tgUser.id) {
        saveProgressToCloud();
    }
}, 120000);

// Сохраняем монеты раз в 10 секунд
setInterval(() => {
    if (window.tgUser && window.tgUser.id && window.gameState.coins) {
        saveCoinsToCloud();
    }
}, 10000);

// Сохраняем перед закрытием
window.addEventListener('beforeunload', () => {
    if (window.tgUser && window.tgUser.id) {
        saveProgressToCloud();
        saveCoinsToCloud();
    }
});

// Экспортируем функции
window.updateAvatars = updateAvatars;
window.saveProgressToCloud = saveProgressToCloud;
window.saveCoinsToCloud = saveCoinsToCloud;
window.loadFromCloud = loadFromCloud;

// Запускаем инициализацию Telegram
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
});

// Обновляем при переключении на вкладку инвентаря
const originalUpdateInventoryUI = window.updateInventoryUI;
if (originalUpdateInventoryUI) {
    window.updateInventoryUI = function() {
        originalUpdateInventoryUI();
        setTimeout(updateAvatars, 50);
    };
}