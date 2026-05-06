// ============= ИНВЕНТАРЬ =============
function updateInventoryUI() {
    const grid = document.getElementById('invGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const sortedInventory = sortByRarityAscending(inventory);
    
    sortedInventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.position = 'relative';
        
        if (item.iconImg) {
            const img = document.createElement('img');
            img.src = item.iconImg;
            img.setAttribute('data-rarity', item.rarity);
            img.style.width = '80%';
            img.style.height = '80%';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '12px';
            div.appendChild(img);
        } else {
            div.innerText = item.type === 'weapon' ? '🔫' : '🔧';
        }
        
        div.style.border = `2px solid ${item.color}`;
        div.style.boxShadow = getRarityGlow(item.rarity);
        div.style.background = '#2a2a2e';
        
        if (equipped[item.type] && equipped[item.type].id === item.id) {
            div.style.outline = '2px solid gold';
            div.style.opacity = '0.9';
        }
        
        if (item.stats && item.stats.upgradeLevel > 0) {
            const upgradeSpan = document.createElement('span');
            upgradeSpan.innerText = `+${item.stats.upgradeLevel}`;
            upgradeSpan.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 2px;
                font-size: 11px;
                font-weight: bold;
                color: #ffd54f;
                background: rgba(0,0,0,0.6);
                padding: 0px 4px;
                border-radius: 10px;
                z-index: 5;
            `;
            div.appendChild(upgradeSpan);
        }
        
        div.onclick = () => openItem(item);
        grid.appendChild(div);
    });
}

function updateSlots() {
    const slots = ['weapon', 'sight', 'laser', 'magazine', 'silencer'];
    slots.forEach(slotType => {
        const slot = document.querySelector(`.slot[data-type="${slotType}"]`);
        const item = equipped[slotType];
        if (slot) {
            slot.innerHTML = '';
            slot.style.position = 'relative';
            
            if (item && item.iconImg) {
                const img = document.createElement('img');
                img.src = item.iconImg;
                img.setAttribute('data-rarity', item.rarity);
                img.style.width = '70%';
                img.style.height = '70%';
                img.style.objectFit = 'contain';
                img.style.borderRadius = '10px';
                slot.appendChild(img);
                
                const span = document.createElement('span');
                span.innerText = slotType === 'weapon' ? 'ОРУЖИЕ' : 
                                 slotType === 'sight' ? 'ПРИЦЕЛ' :
                                 slotType === 'laser' ? 'ЛАЗЕР' :
                                 slotType === 'magazine' ? 'МАГАЗИН' : 'ГЛУШИТЕЛЬ';
                span.style.fontSize = '8px';
                span.style.marginTop = '4px';
                span.style.color = '#ffd966';
                slot.appendChild(span);
                slot.style.opacity = "1";
                slot.style.border = `2px solid ${item.color}`;
                slot.style.boxShadow = getRarityGlow(item.rarity);
                slot.style.background = '#2a2a2e';
                
                if (item.stats && item.stats.upgradeLevel > 0) {
                    const upgradeSpan = document.createElement('span');
                    upgradeSpan.innerText = `+${item.stats.upgradeLevel}`;
                    upgradeSpan.style.cssText = `
                        position: absolute;
                        bottom: 2px;
                        right: 2px;
                        font-size: 10px;
                        font-weight: bold;
                        color: #ffd54f;
                        background: rgba(0,0,0,0.6);
                        padding: 0px 4px;
                        border-radius: 10px;
                        z-index: 5;
                    `;
                    slot.appendChild(upgradeSpan);
                }
                
                slot.onclick = (e) => {
                    e.stopPropagation();
                    openItem(item);
                };
            } else {
                const icons = { weapon: 'fa-gun', sight: 'fa-crosshairs', laser: 'fa-lightbulb', magazine: 'fa-drumstick-bite', silencer: 'fa-volume-off' };
                const names = { weapon: 'ОРУЖИЕ', sight: 'ПРИЦЕЛ', laser: 'ЛАЗЕР', magazine: 'МАГАЗИН', silencer: 'ГЛУШИТЕЛЬ' };
                slot.innerHTML = `<i class="fa-solid ${icons[slotType]}" style="font-size: 24px;"></i><span>${names[slotType]}</span>`;
                slot.style.opacity = "0.4";
                slot.style.border = "2px solid #333";
                slot.style.boxShadow = "none";
                slot.style.background = '#1c1c1e';
                slot.onclick = null;
            }
        }
    });
}

function openItem(item) {
    if (!item) return;
    
    selectedItem = item;
    const modal = document.getElementById('itemModal');
    const overlay = document.getElementById('modalOverlay');
    const info = document.getElementById('itemInfo');
    const upgradeLevel = item.stats?.upgradeLevel || 0;
    
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    let text = `${item.name} +${upgradeLevel}\nРедкость: ${item.rarity.toUpperCase()}\nТип: ${getTypeName(item.type)}\n\n📊 Характеристики:\n`;
    
    for (let key in item.stats) {
        if (key === 'upgradeLevel') continue;
        
        let statName = key === 'damage' ? '💥 Урон' :
                       key === 'attackSpeed' ? '⚡ Скорость атаки' :
                       key === 'critChance' ? '🎯 Шанс крита' : '💢 Крит урон';
        
        let value = item.stats[key];
        let displayValue;
        
        if (key === 'attackSpeed') {
            displayValue = '+' + value.toFixed(1) + ' выстр/с';
        } else if (key === 'critChance' || key === 'critDamage') {
            displayValue = '+' + value + '%';
        } else {
            displayValue = '+' + value;
        }
        
        text += `${statName}: ${displayValue}\n`;
    }
    
    if (upgradeLevel > 0) text += `\n✨ Улучшение: +${upgradeLevel}`;
    
    info.innerText = text;
    info.style.color = item.color;
    
    const isEquipped = equipped[item.type] && equipped[item.type].id === item.id;
    
    const equipBtn = document.getElementById('equipBtn');
    const unequipBtn = document.getElementById('unequipBtn');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const sellOnMarketBtn = document.getElementById('sellOnMarketBtn');
    const sellBtn = document.getElementById('sellBtn');
    
    equipBtn.innerHTML = '⚡ НАДЕТЬ';
    equipBtn.style.background = '#ffd54f';
    equipBtn.style.display = isEquipped ? 'none' : 'block';
    
    unequipBtn.style.display = isEquipped ? 'block' : 'none';
    upgradeBtn.style.display = 'block';
    sellOnMarketBtn.style.display = 'block';
    sellBtn.style.display = 'none';
    
    const newEquipBtn = equipBtn.cloneNode(true);
    equipBtn.parentNode.replaceChild(newEquipBtn, equipBtn);
    newEquipBtn.onclick = () => { equipItem(); closeItem(); };
    
    const newUnequipBtn = unequipBtn.cloneNode(true);
    unequipBtn.parentNode.replaceChild(newUnequipBtn, unequipBtn);
    newUnequipBtn.onclick = () => { unequipItem(); closeItem(); };
    
    const newUpgradeBtn = upgradeBtn.cloneNode(true);
    upgradeBtn.parentNode.replaceChild(newUpgradeBtn, upgradeBtn);
    newUpgradeBtn.onclick = () => { 
        const itemRef = selectedItem;
        closeItem(); 
        if (itemRef && typeof window.openUpgradeModal === 'function') {
            window.openUpgradeModal(itemRef);
        } else {
            showToast('❌ Система улучшений не загружена! Обновите страницу.', true);
        }
    };
    
    const newSellOnMarketBtn = sellOnMarketBtn.cloneNode(true);
    sellOnMarketBtn.parentNode.replaceChild(newSellOnMarketBtn, sellOnMarketBtn);
    newSellOnMarketBtn.onclick = () => { 
        const itemRef = selectedItem;
        closeItem(); 
        if (itemRef && typeof window.openSellPriceModal === 'function') {
            window.openSellPriceModal(itemRef);
        } else {
            showToast('❌ Система рынка не загружена! Обновите страницу.', true);
        }
    };

    document.getElementById('closeModalBtn').onclick = () => closeItem();
}

function closeItem() {
    document.getElementById('itemModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    selectedItem = null;
}

function equipItem() {
    if (!selectedItem) return;
    const type = selectedItem.type;
    if (equipped[type]) inventory.push(equipped[type]);
    equipped[type] = selectedItem;
    inventory = inventory.filter(i => i.id !== selectedItem.id);
    updateInventoryUI();
    updateSlots();
    applyEquipmentStats();
    closeItem();
}

function unequipItem() {
    if (!selectedItem) return;
    const type = selectedItem.type;
    if (equipped[type] && equipped[type].id === selectedItem.id) {
        inventory.push(selectedItem);
        equipped[type] = null;
        updateInventoryUI();
        updateSlots();
        applyEquipmentStats();
    }
    closeItem();
}

function applyEquipmentStats() {
    let totalDamage = 10;
    let totalAttackSpeed = 1.0;
    let critChance = 0;
    let critDamagePercent = 0;
    
    // Получаем базовые статы от уровня (ВАЖНО: через getBaseStats)
    if (window.gameAPI && window.gameAPI.getBaseStats) {
        const base = window.gameAPI.getBaseStats();
        totalDamage = base.damage;
        totalAttackSpeed = base.attackSpeed;
    }
    
    // Добавляем статы от экипировки
    if (equipped.weapon && equipped.weapon.stats) {
        if (equipped.weapon.stats.damage) totalDamage += equipped.weapon.stats.damage;
        if (equipped.weapon.stats.attackSpeed) totalAttackSpeed += equipped.weapon.stats.attackSpeed;
        if (equipped.weapon.stats.critChance) critChance += equipped.weapon.stats.critChance;
        if (equipped.weapon.stats.critDamage) critDamagePercent += equipped.weapon.stats.critDamage;
    }
    if (equipped.sight && equipped.sight.stats) {
        if (equipped.sight.stats.critChance) critChance += equipped.sight.stats.critChance;
        if (equipped.sight.stats.critDamage) critDamagePercent += equipped.sight.stats.critDamage;
    }
    if (equipped.laser && equipped.laser.stats) {
        if (equipped.laser.stats.attackSpeed) totalAttackSpeed += equipped.laser.stats.attackSpeed;
        if (equipped.laser.stats.critChance) critChance += equipped.laser.stats.critChance;
    }
    if (equipped.magazine && equipped.magazine.stats) {
        if (equipped.magazine.stats.damage) totalDamage += equipped.magazine.stats.damage;
        if (equipped.magazine.stats.attackSpeed) totalAttackSpeed += equipped.magazine.stats.attackSpeed;
    }
    if (equipped.silencer && equipped.silencer.stats) {
        if (equipped.silencer.stats.critDamage) critDamagePercent += equipped.silencer.stats.critDamage;
        if (equipped.silencer.stats.critChance) critChance += equipped.silencer.stats.critChance;
    }
    
    // Округляем
    totalDamage = Math.floor(totalDamage);
    totalAttackSpeed = Math.round(totalAttackSpeed * 10) / 10;
    critChance = Math.round(critChance * 10) / 10;
    critDamagePercent = Math.round(critDamagePercent * 10) / 10;
    
    const critDamageMultiplier = 1.0 + (critDamagePercent / 100);
    
    // Применяем к gameState
    if (window.gameAPI) {
        window.gameAPI.updateDamage(totalDamage);
        window.gameAPI.updateAttackSpeed(totalAttackSpeed);
        window.gameAPI.updateCritChance(critChance);
        if (window.gameAPI.updateCritDamage) window.gameAPI.updateCritDamage(critDamageMultiplier);
    }
    
    // Обновляем UI
    const damageSpan = document.getElementById('statDamageValue');
    if (damageSpan) damageSpan.innerText = totalDamage;
    
    const speedSpan = document.getElementById('statSpeedValue');
    if (speedSpan) speedSpan.innerText = totalAttackSpeed.toFixed(1);
    
    const critChanceSpan = document.getElementById('statCritChanceValue');
    if (critChanceSpan) critChanceSpan.innerText = critChance + '%';
    
    const critDamageSpan = document.getElementById('statCritDamageValue');
    if (critDamageSpan) critDamageSpan.innerText = '+' + critDamagePercent + '%';
    
    if (window.gameAPI && window.gameAPI.updatePowerDisplay) window.gameAPI.updatePowerDisplay();
}

window.updateInventoryUI = updateInventoryUI;
window.updateSlots = updateSlots;
window.openItem = openItem;
window.closeItem = closeItem;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.applyEquipmentStats = applyEquipmentStats;