// ============= МАГАЗИН =============
let shopItems = [];

function initShop() {
    shopItems = ALL_ITEMS.map(item => ({
        ...item,
        id: Date.now() + Math.random() + item.name,
        color: getRarityColor(item.rarity)
    }));
}

function formatStatsForModal(stats) {
    const statNames = { damage: '💥 Урон', attackSpeed: '⚡ Скорость атаки', critChance: '🎯 Шанс крита', critDamage: '💢 Крит урон' };
    const statValues = {
        damage: (v) => `+${v}`,
        attackSpeed: (v) => `+${v.toFixed(1)} выстр/с`,
        critChance: (v) => `+${v}%`,
        critDamage: (v) => `+${v}%`
    };
    if (!stats || Object.keys(stats).length === 0) return 'Нет характеристик';
    return Object.entries(stats).map(([key, value]) => {
        if (key === 'upgradeLevel') return '';
        return `${statNames[key]}: ${statValues[key](value)}`;
    }).filter(s => s).join('\n');
}

function renderShop(category = "all") {
    const container = document.getElementById('shopItems');
    if (!container) return;
    
    let filtered = shopItems;
    if (category === "weapon") filtered = shopItems.filter(i => i.type === "weapon");
    if (category === "module") filtered = shopItems.filter(i => i.type !== "weapon");
    
    const grouped = { common: [], uncommon: [], rare: [], epic: [], legendary: [] };
    filtered.forEach(item => { if (grouped[item.rarity]) grouped[item.rarity].push(item); });
    
    let html = '';
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    rarityOrder.forEach(rarity => {
        if (grouped[rarity].length > 0) {
            html += `<div class="shop-section-title" style="color: ${getRarityColor(rarity)};">★ ${getRarityTitle(rarity)} ★</div>`;
            grouped[rarity].forEach(item => {
                html += `
                <div class="shop-item" data-item-id="${item.id}" onclick="showItemInfo('${item.id}')" style="border: 1px solid ${item.color};">
                    <div class="shop-item-icon"><img src="${item.iconImg}" data-rarity="${item.rarity}"></div>
                    <div class="shop-item-name" style="color: ${item.color}">${item.name}</div>
                    <div class="shop-item-price"><i class="fa-solid fa-coins"></i><span>${item.basePrice}</span></div>
                    <button class="shop-buy-btn" onclick="event.stopPropagation(); buyFromShop('${item.id}')">КУПИТЬ</button>
                </div>`;
            });
        }
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.shop-cat').forEach(btn => {
        if (btn.dataset.cat === category) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function showItemInfo(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    const modal = document.getElementById('itemModal');
    const overlay = document.getElementById('modalOverlay');
    const itemInfo = document.getElementById('itemInfo');
    const statsText = formatStatsForModal(item.stats);
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
    itemInfo.innerHTML = `
        <div style="text-align: center; margin-bottom: 8px;">
            <img src="${item.iconImg}" data-rarity="${item.rarity}" style="width: 64px; height: 64px; object-fit: contain; margin: 0 auto; display: block; border-radius: 12px;">
            <div style="font-size: 14px; font-weight: bold; color: ${item.color}; margin-top: 8px;">${item.name}</div>
            <div style="font-size: 9px; color: ${item.color};">${getRarityName(item.rarity)}</div>
            <div style="font-size: 9px; color: #aaa;">${getTypeName(item.type)}</div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
            <div style="font-size: 10px; font-weight: 600; margin-bottom: 6px;">📊 ХАРАКТЕРИСТИКИ</div>
            <div style="font-size: 10px; line-height: 1.5;">${statsText.replace(/\n/g, '<br>')}</div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px; display: flex; justify-content: space-between;">
            <span style="font-size: 10px; color: #aaa;">💰 Цена</span>
            <span style="font-size: 12px; font-weight: bold; color: #ffd54f;">${item.basePrice} монет</span>
        </div>
    `;
    
    document.getElementById('equipBtn').innerHTML = '🛒 КУПИТЬ';
    document.getElementById('equipBtn').style.background = '#ffd54f';
    document.getElementById('equipBtn').style.display = 'block';
    document.getElementById('unequipBtn').style.display = 'none';
    document.getElementById('upgradeBtn').style.display = 'none';
    document.getElementById('sellOnMarketBtn').style.display = 'none';
    document.getElementById('sellBtn').style.display = 'none';
    
    const newEquipBtn = document.getElementById('equipBtn').cloneNode(true);
    document.getElementById('equipBtn').parentNode.replaceChild(newEquipBtn, document.getElementById('equipBtn'));
    newEquipBtn.onclick = () => { buyFromShop(item.id); closeItem(); };
    document.getElementById('closeModalBtn').onclick = () => closeItem();
}

function buyFromShop(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    const price = item.basePrice;
    if (!window.gameState || window.gameState.coins < price) {
        showToast(`❌ НЕ ХВАТАЕТ МОНЕТ! Нужно ${price}, у вас ${window.gameState?.coins || 0}`, true);
        return;
    }
    window.gameState.coins -= price;
    const newItem = {
        ...item,
        id: Date.now() + Math.random(),
        stats: { ...item.stats, upgradeLevel: 0 }
    };
    inventory.push(newItem);
    updateInventoryUI();
    const coinsSpan = document.getElementById('uiCoins');
    if (coinsSpan) coinsSpan.innerText = window.gameState.coins;
    showToast(`✅ Куплен ${item.name} за ${price} монет!`);
}

window.initShop = initShop;
window.renderShop = renderShop;