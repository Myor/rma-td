"use strict";

game.setupInput = function () {

    // Kein Kontextmenü
    game.canvasEl.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    // Klick auf Spielfeld
    game.canvasEl.addEventListener("click", clickHandler);
    // Mob spawn
    mobSpawnBtns.addEventListener("click", mobHandler);
    document.addEventListener("keypress", keyHandler);
    // Tower spawn
    towerPlaceBtns.addEventListener("click", placeHandler);
    towerCancelBtn.addEventListener("click", cancelHandler);
    // Tower verkauf
    tSellBtn.addEventListener("click", sellHandler);

    //TowerMenu
    showTowersBtn.addEventListener("click", ui.showMenu);
    // Test krams
    var startBtn = document.getElementById("start");
    var stopBtn = document.getElementById("stop");
    startBtn.addEventListener("click", function () {
        game.startGameLoop();
        stopBtn.disabled = false;
        startBtn.disabled = true;
    });
    stopBtn.addEventListener("click", function () {
        game.stopGameLoop();
        stopBtn.disabled = true;
        startBtn.disabled = false;
    });

    document.getElementById("towerRand").addEventListener("click", function () {
        randomTowers();
    });

};

var ui = {};

var mobSpawnBtns = document.getElementById("mobs");

var showTowersBtn = document.getElementById("showTowers");
var towerMenu = document.getElementById("towerMenu");
var towerInfo = document.getElementById("towerInfo");
var towerSelectedInfo = document.getElementById("towerSelectedInfo");

var towerPlaceBtns = document.getElementById("towers");
var towerCancelBtn = document.getElementById("towerCancel");

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

    var nameDesc= "<span>"+type.name+"</span></br>"+type.desc;

    var table = "<table>";
    if('power' in type)
        table += "<tr><td>Damage</td><td>"+type.power+"</td></tr>";
    if('freq' in type)
        table += "<tr><td>Speed</td><td>"+type.freq+"</td></tr>";
    if('radius' in type)
        table += "<tr><td>Radius</td><td>"+type.radius+"</td></tr>";

    table += "<tr><td>Price</td><td>"+type.price+"</td></tr>";
    table += "</table";

    towerInfo.innerHTML = nameDesc+table;
};

var tName = towerSelectedInfo.querySelector(".tName");
var tKillCount = towerSelectedInfo.querySelector(".tKillCount");
var tSellBtn = towerSelectedInfo.querySelector(".tSellBtn");
var tSellPrice = towerSelectedInfo.querySelector(".tSellPrice");

var fillInfoSelected = function (tower) {
    var type = tower.type;
    
    tName.textContent = type.name;
    tKillCount.textContent = tower.killCount;
    tSellPrice.textContent = type.sellPrice;
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

// ===== Mob Spawns =====
var mobHandler = function (e) {
    if (!e.target.matches("button.mob")) return;
    var typeID = Number(e.target.dataset.type);

    game.spawnMob(typeID);
};
var keyHandler = function (e) {
    var num = Number(String.fromCharCode(e.charCode)) - 1;
    if (Number.isNaN(num)) return;
    // Typ vorhanden?
    if (towerTypes[num] === undefined) return;
    game.spawnMob(num);
};


// ====== Tower Placing =======
// Maus und Touch haben getrennte Events, welche sich leicht unterschiedlich Verhalten :-/

// Auswählen beim Placen verhindern
var selectBlocked = false;
// Tower Typ zum placen speichern
var placeType = -1;

var placeHandler = function (e) {
    // Klicks auf Tower-Button
    if (e.target.matches("button.tower")) {
        ui.hideMenu();
        // Wenn setzen schon aktiv - beenden
        if (placeType !== -1) endPlace();
        // Gewählten Tower merken
        placeType = Number(e.target.dataset.type);
        startPlace();
    } else if (e.target.matches("button.towerInfo")) {
        // Klick auf Info-Button
        var towerID = Number(e.target.dataset.type);
        fillTowerInfo(towerID);
        ui.showInfo();
    }

};
var cancelHandler = function () {
    endPlace();
};

var startPlace = function () {
    console.log("startplace", placeType);

    towerCancelBtn.disabled = false;
    addPlaceListeners();
    game.setSelectedTower(null);
    selectBlocked = true;
    game.drawSelectCircle(game.towerTypes[placeType]);
};

var endPlace = function () {
    console.log("endplace", placeType);
    towerCancelBtn.disabled = true;

    removePlaceListeners();
    game.selectGr.visible = false;
    game.selectCircleGr.visible = false;
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
        endPlace();
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
        // Nur beenden, wenn setzen erfolgreich
        if (game.addTowerAt(placeType, cx, cy)) {
            endPlace();
        }
    }
};


var sellHandler = function () {
    var tower = game.getSelectedTower();
    if (tower === null) return;
    console.log("sell", tower);
    game.sellTower(tower);
    game.setSelectedTower(null);

};

