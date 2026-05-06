// ============= ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ UI =============

// Временное хранилище монет
let tempCoins = 0;

// Telegram Web App
let tg = null;

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
        
        // Проверяем, активна ли сейчас вкладка игры
        const currentTab = document.querySelector('.nav-item.active')?.dataset.tab;
        
        if (currentTab === 'game') {
            btn.style.display = 'flex'; // Всегда показываем на вкладке игры
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
    
    // Добавляем в основной баланс
    window.gameState.coins += tempCoins;
    
    // Обновляем отображение
    const coinsSpan = document.getElementById('uiCoins');
    if (coinsSpan) coinsSpan.innerText = window.gameState.coins.toFixed(3);
    if (window.coinText) window.coinText.setText('💰 ' + window.gameState.coins.toFixed(3));
    
    showToast(`💰 Вы собрали ${tempCoins.toFixed(3)} монет!`);
    
    // Очищаем временное хранилище
    tempCoins = 0;
    
    // Обновляем кнопку (она покажет 0 и станет неактивной, но не исчезнет)
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

// Инициализация Telegram Web App
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand(); // Разворачивает на весь экран
        
        // Устанавливаем цвет фона под тему Telegram
        if (tg.themeParams.bg_color) {
            document.body.style.backgroundColor = tg.themeParams.bg_color;
        }
        
        // Показываем кнопку "Назад" если нужно
        tg.BackButton.hide();
        
        console.log("Telegram Web App инициализирован");
    }
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

// Экспортируем функции для game.js
window.addTempCoins = addTempCoins;
window.collectCoins = collectCoins;

// Показываем уведомления
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

// Функция для обновления кнопки при переключении вкладок
function setCurrentTab(tab) {
    if (tab === 'game') {
        setTimeout(function() {
            updateCollectButton();
        }, 50);
    }
}

// Экспортируем функции для доступа из index.html
window.setCurrentTab = setCurrentTab;
window.updateCollectButton = updateCollectButton;

// Инициализация Telegram при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
});

// Экспортируем tg для других файлов
window.tg = tg;