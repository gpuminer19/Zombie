// ============= ВСЕ ПРЕДМЕТЫ ИГРЫ (ЕДИНЫЙ ИСТОЧНИК) =============

const ALL_ITEMS = [
    { name: "АК-74", type: "weapon", rarity: "common", basePrice: 1, iconImg: "1.png", stats: { damage: 10 } },
    { name: "Прицел", type: "sight", rarity: "common", basePrice: 1, iconImg: "ak1.png", stats: { critChance: 2.5 } },
    { name: "Лазер", type: "laser", rarity: "common", basePrice: 1, iconImg: "ak2.png", stats: { attackSpeed: 0.12 } },
    { name: "Магазин", type: "magazine", rarity: "common", basePrice: 1, iconImg: "ak3.png", stats: { damage: 10 } },
    { name: "Глушитель", type: "silencer", rarity: "common", basePrice: 1, iconImg: "ak4.png", stats: { critDamage: 12.5 } },
    
    { name: "АК-74", type: "weapon", rarity: "uncommon", basePrice: 10, iconImg: "2.png", stats: { damage: 20, critChance: 2.5 } },
    { name: "Прицел", type: "sight", rarity: "uncommon", basePrice: 10, iconImg: "ak1.png", stats: { critChance: 4, critDamage: 7.5 } },
    { name: "Лазер", type: "laser", rarity: "uncommon", basePrice: 10, iconImg: "ak2.png", stats: { attackSpeed: 0.17, critChance: 1.5 } },
    { name: "Магазин", type: "magazine", rarity: "uncommon", basePrice: 10, iconImg: "ak3.png", stats: { damage: 15, attackSpeed: 0.05 } },
    { name: "Глушитель", type: "silencer", rarity: "uncommon", basePrice: 10, iconImg: "ak4.png", stats: { critDamage: 17.5, critChance: 1.5 } },
    
    { name: "АК-74", type: "weapon", rarity: "rare", basePrice: 100, iconImg: "3.png", stats: { damage: 35, attackSpeed: 0.15 } },
    { name: "Прицел", type: "sight", rarity: "rare", basePrice: 100, iconImg: "ak1.png", stats: { critChance: 6, critDamage: 10 } },
    { name: "Лазер", type: "laser", rarity: "rare", basePrice: 100, iconImg: "ak2.png", stats: { attackSpeed: 0.25, critChance: 2.5 } },
    { name: "Магазин", type: "magazine", rarity: "rare", basePrice: 100, iconImg: "ak3.png", stats: { damage: 25, attackSpeed: 0.07 } },
    { name: "Глушитель", type: "silencer", rarity: "rare", basePrice: 100, iconImg: "ak4.png", stats: { critDamage: 25, critChance: 2.5 } },
    
    { name: "АК-74", type: "weapon", rarity: "epic", basePrice: 1000, iconImg: "4.png", stats: { damage: 60, critChance: 5, critDamage: 20 } },
    { name: "Прицел", type: "sight", rarity: "epic", basePrice: 1000, iconImg: "ak1.png", stats: { critChance: 10, critDamage: 20 } },
    { name: "Лазер", type: "laser", rarity: "epic", basePrice: 1000, iconImg: "ak2.png", stats: { attackSpeed: 0.4, critChance: 5 } },
    { name: "Магазин", type: "magazine", rarity: "epic", basePrice: 1000, iconImg: "ak3.png", stats: { damage: 40, attackSpeed: 0.15 } },
    { name: "Глушитель", type: "silencer", rarity: "epic", basePrice: 1000, iconImg: "ak4.png", stats: { critDamage: 40, critChance: 5 } },
    
    { name: "АК-74", type: "weapon", rarity: "legendary", basePrice: 5000, iconImg: "5.png", stats: { damage: 100, attackSpeed: 0.3, critChance: 7.5, critDamage: 40 } },
    { name: "Прицел", type: "sight", rarity: "legendary", basePrice: 5000, iconImg: "ak1.png", stats: { critChance: 15, critDamage: 30 } },
    { name: "Лазер", type: "laser", rarity: "legendary", basePrice: 5000, iconImg: "ak2.png", stats: { attackSpeed: 0.5, critChance: 7.5 } },
    { name: "Магазин", type: "magazine", rarity: "legendary", basePrice: 5000, iconImg: "ak3.png", stats: { damage: 60, attackSpeed: 0.25 } },
    { name: "Глушитель", type: "silencer", rarity: "legendary", basePrice: 5000, iconImg: "ak4.png", stats: { critDamage: 60, critChance: 7.5 } }
];

const RARITIES = [
    { name: "common", chance: 50, color: "#888", glow: "0 0 6px #888", order: 0, title: "ОБЫЧНЫЕ" },
    { name: "uncommon", chance: 25, color: "#4caf50", glow: "0 0 8px #4caf50", order: 1, title: "НЕОБЫЧНЫЕ" },
    { name: "rare", chance: 15, color: "#3aa0ff", glow: "0 0 10px #3aa0ff", order: 2, title: "РЕДКИЕ" },
    { name: "epic", chance: 7, color: "#a64dff", glow: "0 0 12px #a64dff", order: 3, title: "ЭПИЧЕСКИЕ" },
    { name: "legendary", chance: 3, color: "#ff9f1a", glow: "0 0 14px #ff9f1a", order: 4, title: "ЛЕГЕНДАРНЫЕ" }
];

function getRarityByName(rarityName) {
    return RARITIES.find(r => r.name === rarityName);
}

function getRandomItemByRarity(rarityName) {
    const itemsOfRarity = ALL_ITEMS.filter(item => item.rarity === rarityName);
    if (itemsOfRarity.length === 0) return null;
    return Phaser.Utils.Array.GetRandom(itemsOfRarity);
}