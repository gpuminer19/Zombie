// ============= РЫНОК (ПРОДАЖА ОТ ИГРОКОВ) =============

let soldItems = [];

function renderMarket() {
    const container = document.getElementById('marketItems');
    if (!container) return;

    container.innerHTML = '';

    // Проданные предметы
    soldItems.forEach(sold => {
        const div = document.createElement('div');
        div.className = 'market-item';

        div.innerHTML = `
            <div style="font-weight:bold; color:#ffd54f;">
                ${sold.name} — ПРОДАНО
            </div>
            <div style="font-size:12px; color:#aaa;">
                💰 К получению: ${sold.income}
            </div>
        `;

        const btn = document.createElement('button');
        btn.innerText = `ЗАБРАТЬ (${sold.income})`;
        btn.style.cssText = `
            background:#ffd54f;
            color:black;
            border:none;
            padding:8px 16px;
            border-radius:20px;
            cursor:pointer;
            margin-top:8px;
        `;

        btn.onclick = () => {
            window.gameState.coins += sold.income;
            soldItems = soldItems.filter(s => s.id !== sold.id);
            const coinsSpan = document.getElementById('uiCoins');
            if (coinsSpan) coinsSpan.innerText = window.gameState.coins;
            renderMarket();
            showToast(`💰 Получено ${sold.income} монет`);
        };

        div.appendChild(btn);
        container.appendChild(div);
    });

    // Товары на рынке
    if (marketItems.length === 0) {
        if (soldItems.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'text-align:center; padding:40px; color:#aaa;';
            empty.innerText = '📭 На рынке пока нет товаров';
            container.appendChild(empty);
        }
        return;
    }

    marketItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'market-item';

        const isUserListing = userListings.includes(item.id);
        const upgradeLevel = item.stats?.upgradeLevel || 0;

        // Создаем иконку с бейджем
        const iconWrapper = document.createElement('div');
        iconWrapper.style.position = 'relative';
        iconWrapper.style.display = 'inline-block';
        iconWrapper.style.width = '50px';
        iconWrapper.style.height = '50px';
        
        const img = document.createElement('img');
        img.src = item.iconImg;
        img.setAttribute('data-rarity', item.rarity);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        iconWrapper.appendChild(img);
        
        // Добавляем бейдж +1,+2,+3 и т.д.
        if (upgradeLevel > 0) {
            const badge = document.createElement('span');
            badge.innerText = `+${upgradeLevel}`;
            badge.style.cssText = `
                position: absolute;
                bottom: -4px;
                right: -4px;
                font-size: 10px;
                font-weight: bold;
                color: #ffd54f;
                background: rgba(0,0,0,0.8);
                padding: 2px 5px;
                border-radius: 12px;
                z-index: 5;
                min-width: 22px;
                text-align: center;
            `;
            iconWrapper.appendChild(badge);
        }

        // Основная информация
        const infoDiv = document.createElement('div');
        infoDiv.style.flex = '1';
        infoDiv.innerHTML = `
            <div style="font-weight: bold; font-size: 13px; color: ${item.color}">
                ${item.name} ${upgradeLevel > 0 ? `+${upgradeLevel}` : ''}
            </div>
            <div style="font-size: 10px; color: #aaa;">
                ${getRarityName(item.rarity)}
            </div>
            <div style="font-size: 10px; color: #ffd54f;">
                💰 ${item.sellerPrice} монет
            </div>
        `;

        // Контейнер для левой части (иконка)
        const leftDiv = document.createElement('div');
        leftDiv.style.display = 'flex';
        leftDiv.style.alignItems = 'center';
        leftDiv.style.gap = '12px';
        leftDiv.appendChild(iconWrapper);
        leftDiv.appendChild(infoDiv);

        div.appendChild(leftDiv);

        // Кнопка действия
        const actionsDiv = document.createElement('div');
        actionsDiv.style.marginTop = '10px';

        const btn = document.createElement('button');

        if (isUserListing) {
            btn.innerText = 'СНЯТЬ';
            btn.style.cssText = `
                background:#ff5252;
                color:white;
                border:none;
                padding:8px 16px;
                border-radius:20px;
                cursor:pointer;
            `;
            btn.onclick = () => {
                cancelMarketListing(item.id);
            };
        } else {
            btn.innerText = 'КУПИТЬ';
            btn.style.cssText = `
                background:#4caf50;
                color:white;
                border:none;
                padding:8px 16px;
                border-radius:20px;
                cursor:pointer;
            `;
            btn.onclick = () => {
                buyFromMarket(item.id);
            };
        }

        actionsDiv.appendChild(btn);
        div.appendChild(actionsDiv);
        container.appendChild(div);
    });
}

function buyFromMarket(itemId) {
    const item = marketItems.find(i => i.id === itemId);
    if (!item) return;

    if (window.gameState.coins >= item.sellerPrice) {
        window.gameState.coins -= item.sellerPrice;
        const sellerIncome = Math.floor(item.sellerPrice * 0.9);

        if (userListings.includes(item.id)) {
            soldItems.push({
                id: item.id,
                name: item.name,
                income: sellerIncome
            });
        }

        const boughtItem = JSON.parse(JSON.stringify(item));
        delete boughtItem.sellerPrice;
        delete boughtItem.listedAt;
        boughtItem.id = Date.now() + Math.random();

        inventory.push(boughtItem);
        updateInventoryUI();

        marketItems = marketItems.filter(i => i.id !== itemId);
        userListings = userListings.filter(id => id !== itemId);

        const coinsSpan = document.getElementById('uiCoins');
        if (coinsSpan) coinsSpan.innerText = window.gameState.coins;

        renderMarket();
        showToast(`✅ Куплен ${item.name} за ${item.sellerPrice}`);
    } else {
        showToast(`❌ Не хватает монет`, true);
    }
}

function cancelMarketListing(itemId) {
    const item = marketItems.find(i => i.id === itemId);
    if (!item) return;

    const returnedItem = JSON.parse(JSON.stringify(item));
    delete returnedItem.sellerPrice;
    delete returnedItem.listedAt;
    returnedItem.id = Date.now() + Math.random();

    inventory.push(returnedItem);
    updateInventoryUI();

    marketItems = marketItems.filter(i => i.id !== itemId);
    userListings = userListings.filter(id => id !== itemId);

    renderMarket();
    showToast(`✅ Предмет ${item.name} снят с рынка`);
}

window.renderMarket = renderMarket;
window.buyFromMarket = buyFromMarket;
window.cancelMarketListing = cancelMarketListing;