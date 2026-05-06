// ============= ОБЩИЕ ПЕРЕМЕННЫЕ =============
let inventory = [];
let selectedItem = null;
let equipped = {
    weapon: null,
    sight: null,
    laser: null,
    magazine: null,
    silencer: null
};

let marketItems = [];
let userListings = [];

// ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============
function rollRarity() {
    let rand = Math.random() * 100;
    let sum = 0;
    for (let r of RARITIES) {
        sum += r.chance;
        if (rand <= sum) return r;
    }
    return RARITIES[0];
}

function getRarityColor(rarityName) {
    const rarity = RARITIES.find(r => r.name === rarityName);
    return rarity ? rarity.color : "#888";
}

function getRarityGlow(rarityName) {
    const rarity = RARITIES.find(r => r.name === rarityName);
    return rarity ? rarity.glow : "none";
}

function getRarityTitle(rarityName) {
    const rarity = RARITIES.find(r => r.name === rarityName);
    return rarity ? rarity.title : rarityName.toUpperCase();
}

function getRarityName(rarity) {
    const names = { common: "ОБЫЧНЫЙ", uncommon: "НЕОБЫЧНЫЙ", rare: "РЕДКИЙ", epic: "ЭПИЧЕСКИЙ", legendary: "ЛЕГЕНДАРНЫЙ" };
    return names[rarity] || rarity.toUpperCase();
}

function getRarityOrder(rarity) {
    const order = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    return order[rarity] || 0;
}

function getTypeName(type) {
    const names = {
        weapon: 'Оружие',
        sight: 'Прицел',
        laser: 'Лазер',
        magazine: 'Магазин',
        silencer: 'Глушитель'
    };
    return names[type] || 'Предмет';
}

function sortByRarityAscending(items) {
    const order = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    return [...items].sort((a, b) => order[a.rarity] - order[b.rarity]);
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.cssText = `position:fixed; bottom:140px; left:16px; right:16px; background:${isError ? '#ff5252' : '#4caf50'}; color:white; padding:12px; border-radius:16px; text-align:center; z-index:200; animation:fadeOut 2s forwards; font-size:13px; font-weight:bold;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function saveMarket() {
    localStorage.setItem('marketItems', JSON.stringify(marketItems));
}
setInterval(() => saveMarket(), 5000);

// ============= ДРОП ПРЕДМЕТОВ =============
function dropItem() {
    try {
        const rarity = rollRarity();
        const itemsOfRarity = ALL_ITEMS.filter(item => item.rarity === rarity.name);
        
        if (itemsOfRarity.length === 0) return;
        
        const base = Phaser.Utils.Array.GetRandom(itemsOfRarity);
        
        const item = {
            ...base,
            id: Date.now() + Math.random(),
            color: rarity.color,
            stats: { ...base.stats, upgradeLevel: 0 }
        };
        
        inventory.push(item);
        
        if (typeof updateInventoryUI === 'function') {
            updateInventoryUI();
        }
        
        console.log("Выпал предмет:", item.name, item.rarity);
    } catch(e) {
        console.error("Ошибка дропа:", e);
    }
}

window.dropItem = dropItem;