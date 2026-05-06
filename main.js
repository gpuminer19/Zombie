// ============= ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ UI =============

// Временное хранилище монет
let tempCoins = 0;

// Telegram Web App
let tg = null;
let tgUser = null;

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
            window.tgUser = tgUser; // Сохраняем в window для доступа из других функций
            
            let playerName = tgUser.first_name || tgUser.username || 'БОЕЦ';
            if (tgUser.last_name) {
                playerName = tgUser.first_name + ' ' + tgUser.last_name;
            }
            localStorage.setItem('playerName', playerName);
            
            const nameSpan = document.getElementById('playerName');
            if (nameSpan) nameSpan.innerText = playerName;
            
            console.log('Telegram пользователь:', tgUser);
            console.log('photo_url:', tgUser.photo_url);
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

window.onMonsterKilled = function() { updateLocationUI(); };
window.onDropItem = function() { dropItem(); };
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
    }
}

window.setCurrentTab = setCurrentTab;
window.updateCollectButton = updateCollectButton;

// ============= УПРАВЛЕНИЕ АВАТАРАМИ =============

// Функция для обновления аватаров
function updateAvatars() {
    console.log('updateAvatars вызвана');
    
    // Верхний аватар (берём фото из Telegram)
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
    
    // Аватар в инвентаре (всегда avatar.png)
    const invAvatar = document.getElementById('playerAvatar');
    if (invAvatar) {
        invAvatar.src = 'avatar.png';
        console.log('Аватар инвентаря: avatar.png');
    }
}

// Запускаем инициализацию Telegram и обновление аватаров
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

// Экспортируем функции
window.updateAvatars = updateAvatars;