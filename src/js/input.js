"use strict";

game.setupInput = function () {

    // Kein Kontextmenü
    game.canvasEl.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    // Klick auf Spielfeld
    game.canvasEl.addEventListener("click", clickHandler);
    // Mob spawn
    waveSpawnBtns.addEventListener("click", waveHandler);
    document.addEventListener("keypress", keyHandler);
    // Tower spawn
    towerListBtns.addEventListener("click", towerBtnsHandler);
    cancelPlaceBtn.addEventListener("click", towerCancelHandler);
    // Tower verkauf
    tSellBtn.addEventListener("click", sellHandler);
    // Tower aim setzen
    tAimDiv.addEventListener("click", setAimHandler);
    // Tower upgraden
    tNextBtn.addEventListener("click", upgradeHandler);

    //TowerMenu
    showTowersBtn.addEventListener("click", ui.showMenu);

};

game.removeInput = function () {

    waveSpawnBtns.removeEventListener("click", waveHandler);
    document.removeEventListener("keypress", keyHandler);

    towerListBtns.removeEventListener("click", towerBtnsHandler);
    cancelPlaceBtn.removeEventListener("click", towerCancelHandler);

    tSellBtn.removeEventListener("click", sellHandler);
    tAimDiv.removeEventListener("click", setAimHandler);

    showTowersBtn.removeEventListener("click", ui.showMenu);
};

// Alle statischen Elemente
var waveSpawnBtns = document.getElementById("waves");
// Menüs
var towerMenu = document.getElementById("towerMenu");
var towerInfo = document.getElementById("towerInfo");
var towerSelectedInfo = document.getElementById("towerSelectedInfo");
// Buttons
var showTowersBtn = document.getElementById("showTowers");
var towerListBtns = document.getElementById("towers");
var cancelPlaceBtn = document.getElementById("cancelPlace");
// Selected-infos
var tName = towerSelectedInfo.querySelector(".tName");
var tKillCount = towerSelectedInfo.querySelector(".tKillCount");
var tRadius = towerSelectedInfo.querySelector(".tRadius");
var tPower = towerSelectedInfo.querySelector(".tPower");
var tCurrentLvl = towerSelectedInfo.querySelector(".tCurrentLvl");
var tNextBtn = towerSelectedInfo.querySelector(".tNextBtn");
var tNextLvl = towerSelectedInfo.querySelector(".tNextLvl");
var tNextPrice = towerSelectedInfo.querySelector(".tNextPrice");
var tAimDiv = towerSelectedInfo.querySelector(".tAimDiv");
var tAimBtnList = tAimDiv.querySelectorAll("button");
var tSellBtn = towerSelectedInfo.querySelector(".tSellBtn");
var tSellPrice = towerSelectedInfo.querySelector(".tSellPrice");

var ui = {};
// ===== Menüs =====

ui.showMenu = function () {
    game.setSelectedTower(null);
    towerMenu.classList.remove("hideLeft");
};
ui.hideMenu = function () {
    ui.hideInfo();
    towerMenu.classList.add("hideLeft");
};
ui.showInfo = function () {
    towerInfo.classList.remove("infoHide");
};
ui.hideInfo = function () {
    towerInfo.classList.add("infoHide");
};

ui.showSelectedInfo = function (tower) {
    fillInfoSelected(tower);
    towerSelectedInfo.classList.remove("hideRight");
};
ui.hideSelectedInfo = function () {
    towerSelectedInfo.classList.add("hideRight");
};

var fillTowerInfo = function (id) {
    var type = towerTypes[id];

    var nameDesc = "<span>" + type.name + "</span></br>" + type.desc;

    var table = "<table>";
    if ('power' in type)
        table += "<tr><td>Damage</td><td>" + type.power + "</td></tr>";
    if ('freq' in type)
        table += "<tr><td>Speed</td><td>" + type.freq + "</td></tr>";
    if ('radius' in type)
        table += "<tr><td>Radius</td><td>" + type.radius + "</td></tr>";

    table += "<tr><td>Price</td><td>" + type.price + "</td></tr>";
    table += "</table";

    towerInfo.innerHTML = nameDesc + table;
};

var fillInfoSelected = function (tower) {
    var type = tower.type;

    tName.textContent = type.name;
    tKillCount.textContent = tower.killCount;
    tRadius.textContent = type.radius;
    tPower.textContent = type.power;
    // Upgrades
    tCurrentLvl.textContent = type.level;
    var hasNext = type.next != null;
    tNextLvl.textContent = hasNext ? type.next.level : "-";
    tNextPrice.textContent = hasNext ? type.next.price : "-";
    tNextBtn.disabled = hasNext ? false : true;


    // Aim Buttons ein / ausblenden
    if (tower.aimFunc === null) {
        tAimDiv.classList.add("hidden");
    } else {
        tAimDiv.classList.remove("hidden");
        updateAimBtns(tower.aimFunc.id);
    }


    tSellPrice.textContent = type.sellPrice;
};

// Markiert aim-Button mit Class bzw. entfernt Class
var updateAimBtns = function (newID) {
    for (var i = 0; i < tAimBtnList.length; i++) {
        var btn = tAimBtnList[i];
        btn.classList.remove("active");
        if (btn.matches("button[data-aim='" + newID + "']")) {
            btn.classList.add("active");
        }
    }
};

// ===== Event Handler =====

var clickHandler = function (e) {
    // Menü zuklappen
    ui.hideMenu();
    // Nur bei Linksklick und wenn kein Tower gesetzt wird
    if (selectBlocked || e.button !== 0) return;
    // Zelle berechnen & auswählen
    var cx = utils.pos2Cell(e.offsetX);
    var cy = utils.pos2Cell(e.offsetY);
    game.setSelectedTower(game.getTowerAt(cx, cy));
};

// ===== Spawns =====
var waveHandler = function (e) {
    if (!e.target.matches("button.wave")) return;
    var id = Number(e.target.dataset.id);

    game.startWave(id);
};
var keyHandler = function (e) {
    var id = Number(String.fromCharCode(e.charCode)) - 1;
    if (Number.isNaN(id)) return;
    // Typ vorhanden?
    if (game.waves[id] === undefined) return;
    game.startWave(id);
};


// ====== Tower Placing =======
// Maus und Touch haben getrennte Events, welche sich leicht unterschiedlich Verhalten :-/

// Auswählen beim Placen verhindern
var selectBlocked = false;
// Tower Typ zum placen speichern
var placeType = -1;

var towerBtnsHandler = function (e) {
    // Klicks auf Tower-Button
    if (e.target.matches("button.tower")) {
        ui.hideMenu();
        // Wenn setzen schon aktiv - beenden
        if (placeType !== -1) ui.endPlace();
        // Gewählten Tower merken
        placeType = Number(e.target.dataset.type);
        ui.startPlace();
    } else if (e.target.matches("button.towerInfo")) {
        // Klick auf Info-Button
        var towerID = Number(e.target.dataset.type);
        fillTowerInfo(towerID);
        ui.showInfo();
    }

};
var towerCancelHandler = function () {
    ui.endPlace();
};

ui.startPlace = function () {
    console.log("startplace", placeType);
    cancelPlaceBtn.disabled = false;

    addPlaceListeners();
    game.setSelectedTower(null);
    selectBlocked = true;
    game.drawSelectCircle(towerTypes[placeType]);
};

ui.endPlace = function () {
    console.log("endplace", placeType);
    cancelPlaceBtn.disabled = true;

    removePlaceListeners();
    game.hideSelection();
    selectBlocked = false;
    placeType = -1;
};

// Events zum Updaten / Beenden beim Placen
var addPlaceListeners = function () {
    game.canvasEl.addEventListener("mousemove", moveplaceHandlerMouse);
    game.canvasEl.addEventListener("mouseup", endPlaceHandlerMouse);
    game.canvasEl.addEventListener("touchmove", movePlaceHandlerTouch);
    game.canvasEl.addEventListener("touchend", endPlaceHandlerTouch);
};
var removePlaceListeners = function () {
    game.canvasEl.removeEventListener("mousemove", moveplaceHandlerMouse);
    game.canvasEl.removeEventListener("mouseup", endPlaceHandlerMouse);
    game.canvasEl.removeEventListener("touchmove", movePlaceHandlerTouch);
    game.canvasEl.removeEventListener("touchend", endPlaceHandlerTouch);
};
// == Maus ==
var moveplaceHandlerMouse = function (e) {
    updatePlace(utils.pos2Cell(e.offsetX), utils.pos2Cell(e.offsetY));
};
var endPlaceHandlerMouse = function (e) {
    if (e.button === 0) {
        // Linke Maustaste
        tryPlace(utils.pos2Cell(e.offsetX), utils.pos2Cell(e.offsetY));
    } else if (e.button === 2) {
        // Rechte Maustaste
        ui.endPlace();
    }
};
// == Touch ==
// Touch Events haben keine "offset" Eigenschft
var movePlaceHandlerTouch = function (e) {
    var t = e.targetTouches[0];
    updatePlace(utils.pos2Cell(t.pageX - game.canvasoffsetX), utils.pos2Cell(t.pageY - game.canvasoffsetY));
};
var endPlaceHandlerTouch = function (e) {
    var t = e.changedTouches[0];
    tryPlace(utils.pos2Cell(t.pageX - game.canvasoffsetX), utils.pos2Cell(t.pageY - game.canvasoffsetY));
};

// TODO hier könnte man die Textur des Towers anzeigen
var updatePlace = function (cx, cy) {
    game.showSelection();
    // Kreis und Platzhalter mitbewegen, wenn im Feld
    if (game.fieldRect.contains(cx, cy)) {
        game.moveSelectionTo(cx, cy);
    }
};

// Versuchen einen Tower zu setzen
var tryPlace = function (cx, cy) {
    console.log("tryplace", cx, cy);
    if (game.fieldRect.contains(cx, cy)) {
        game.tryAddTowerAt(placeType, cx, cy);
    }
};

// Verkauft ausgewählten Tower
var sellHandler = function () {
    var tower = game.getSelectedTower();
    if (tower === null) return;
    console.log("sell", tower);
    game.sellTower(tower);
    game.setSelectedTower(null);

};
// Setzt aim-Funktion von ausgewähltem Tower
var setAimHandler = function (e) {
    if (!e.target.matches("button")) return;
    var tower = game.getSelectedTower();
    var newAimFunc = aimFuncs[e.target.dataset.aim];
    tower.aimFunc = newAimFunc;
    updateAimBtns(newAimFunc.id);
};

var upgradeHandler = function () {
    var tower = game.getSelectedTower();
    var newTower = game.upgradeTower(tower);
    game.setSelectedTower(newTower);
};

// Test krams

document.getElementById("towerRand").addEventListener("click", function () {
    randomTowers();
});