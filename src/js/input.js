"use strict";

// Alle statischen Elemente
var gameWrapper = document.getElementById("gameWrapper");
// Game Menüs
var mainMenu = document.getElementById("mainMenu");
var towerMenu = document.getElementById("towerMenu");
var towerInfo = document.getElementById("towerInfo");
var towerSelectedInfo = document.getElementById("towerSelectedInfo");
// Buttons Game
var nextWaveButton = document.getElementById("nextWave");
var pauseButton = document.getElementById("pauseGame"); 
var fastForwardButton = document.getElementById("fastForward");
var showTowersBtn = document.getElementById("showTowers");
var towerListBtns = document.getElementById("towers");
var cancelPlaceBtn = document.getElementById("cancelPlace");
var exitBtn = document.getElementById("exitBtn");
// Menü
var playButton = document.getElementById("playGame");
var mapSelectDiv = document.getElementById("mapSelect");
var map1Button = document.getElementById("playMap1");
var map2Button = document.getElementById("playMap2");
var inputGameMode1 = document.getElementById("inputGameMode1");

// Selected-infos
var tName = towerSelectedInfo.querySelector(".tName");
var tKillCount = towerSelectedInfo.querySelector(".tKillCount");
var tPower = towerSelectedInfo.querySelector(".tPower");
var tFreq = towerSelectedInfo.querySelector(".tFreq");
var tRadius = towerSelectedInfo.querySelector(".tRadius");
var tCurrentLvl = towerSelectedInfo.querySelector(".tCurrentLvl");
var tNextBtn = towerSelectedInfo.querySelector(".tNextBtn");
var tNextLvl = towerSelectedInfo.querySelector(".tNextLvl");
var tNextPrice = towerSelectedInfo.querySelector(".tNextPrice");
var tAimDiv = towerSelectedInfo.querySelector(".tAimDiv");
var tAimBtnList = tAimDiv.querySelectorAll("button");
var tSellBtn = towerSelectedInfo.querySelector(".tSellBtn");
var tSellPrice = towerSelectedInfo.querySelector(".tSellPrice");


var showMapSelect = function () {
    mapSelectDiv.classList.remove("hideMapSelect");
};

var startMap1 = function () {
    game.map = game.maps[0];
    setGameMode();
    showGame();
};

var startMap2 = function () {
    game.map = game.maps[1];
    setGameMode();
    showGame();
};

var showGame = function () {
    mapSelectDiv.classList.add("hideMapSelect");
    mainMenu.classList.add("hidden");
    gameWrapper.classList.remove("hidden");

    game.startGame();
};

var setGameMode = function () {
    if(inputGameMode1.checked) {
        game.cash = 2000;
    } else {
        game.cash = Infinity;
    }
};

// ===== Events dynamisch erstellte Elemente =====
game.setupInput = function () {
    // Kein Kontextmenü
    game.canvasEl.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    // Klick auf Spielfeld
    game.canvasEl.addEventListener("click", clickHandler);
    game.canvasEl.addEventListener("touchend", touchHandler);
};


var ui = {};
ui.canVibrate = window.navigator.vibrate !== undefined;
// ===== Menüs =====

ui.showMenu = function () {
    game.setSelectedTower(null);
    towerMenu.classList.remove("hideLeft");
};

ui.exitToMenu = function () {
    mainMenu.classList.remove("hidden");
    gameWrapper.classList.add("hidden");
    game.exitGame();
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

    var nameDesc = "<div class='infoName'>" + type.name + "</div>" + type.desc;

    var table = "<table>";
    if ('power' in type)
        table += "<tr><td>Damage</td><td>" + type.power + "</td></tr>";
    if ('freq' in type)
        table += "<tr><td>Reload</td><td>" + type.freq + "</td></tr>";
    if ('radius' in type)
        table += "<tr><td>Radius</td><td>" + type.radius + "</td></tr>";

    table += "<tr><td>Price</td><td>" + type.price + "</td></tr>";
    table += "</table>";

    towerInfo.innerHTML = nameDesc + table;
};

var fillInfoSelected = function (tower) {
    var type = tower.type;

    tName.textContent = type.name;
    tKillCount.textContent = tower.killCount;
    tPower.textContent = "power" in type ? tower.getPower() : "-";
    tFreq.textContent = "freq" in type ? tower.getFreq() : "-";
    tRadius.textContent = "radius" in type ? type.radius : "-";
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

// ===== Button Handler =====
var waveHandler = function (e) {
    game.startNextWave();
};

var fastHandler = function () {
    if(slowFactor === 1) {
        ui.doubleSpeed();
    } else {
        ui.normalSpeed();
    }
};

ui.doubleSpeed = function () {
    fastForwardButton.classList.add("active");
    slowFactor = 0.5;
};

ui.normalSpeed = function () {
    fastForwardButton.classList.remove("active");
    slowFactor = 1;
};

var pauseHandler = function () {
    if (game.isPaused === false) {
        ui.pauseGame();
    } else {
        ui.resumeGame();
    }
};

ui.pauseGame = function () {
    if(game.isPaused) return;
    game.pauseLoop();
    pauseButton.classList.add("paused");
};
ui.resumeGame = function () {
    if(!game.isPaused) return;
    game.resumeLoop();
    pauseButton.classList.remove("paused");
};

// ===== Event Handler =====

var clickHandler = function (e) {
    // Nur bei Linksklick
    if (e.button !== 0) return;
    clickAt(e.offsetX, e.offsetY);
};
var touchHandler = function (e) {
    var t = e.changedTouches[0];
    clickAt(t.pageX - game.offsetX, t.pageY - game.offsetY);
};

var clickAt = function (x, y) {
    // Menü zuklappen
    ui.hideMenu();
    // Nur wenn kein Tower gesetzt wird
    if (selectBlocked) return;
    // Zelle berechnen & auswählen
    var cx = utils.input2Cell(x);
    var cy = utils.input2Cell(y);
    game.setSelectedTower(game.getTowerAt(cx, cy));
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
    cancelPlaceBtn.disabled = false;

    addPlaceListeners();
    game.setSelectedTower(null);
    selectBlocked = true;
    game.drawSelectCircle(towerTypes[placeType]);
};

ui.endPlace = function () {
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
    updatePlace(utils.input2Cell(e.offsetX), utils.input2Cell(e.offsetY));
};
var endPlaceHandlerMouse = function (e) {
    if (e.button === 0) {
        // Linke Maustaste
        tryPlace(utils.input2Cell(e.offsetX), utils.input2Cell(e.offsetY));
    } else if (e.button === 2) {
        // Rechte Maustaste
        ui.endPlace();
    }
};
// == Touch ==
// Touch Events haben keine "offset" Eigenschft
var movePlaceHandlerTouch = function (e) {
    var t = e.targetTouches[0];
    updatePlace(utils.input2Cell(t.pageX - game.offsetX), utils.input2Cell(t.pageY - game.offsetY));
};
var endPlaceHandlerTouch = function (e) {
    var t = e.changedTouches[0];
    tryPlace(utils.input2Cell(t.pageX - game.offsetX), utils.input2Cell(t.pageY - game.offsetY));
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
    if (game.fieldRect.contains(cx, cy)) {
        game.tryAddTowerAt(placeType, cx, cy);
    }
};

// Verkauft ausgewählten Tower
var sellHandler = function () {
    var tower = game.getSelectedTower();
    if (tower === null) return;
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


// ===== Events bei statischen Elementen =====
// PlayButton
playButton.addEventListener("click", showMapSelect);
map1Button.addEventListener("click", startMap1);
map2Button.addEventListener("click", startMap2);
// Tower spawn
towerListBtns.addEventListener("click", towerBtnsHandler);
cancelPlaceBtn.addEventListener("click", towerCancelHandler);
// Tower verkauf
tSellBtn.addEventListener("click", sellHandler);
// Tower aim setzen
tAimDiv.addEventListener("click", setAimHandler);
// Tower upgraden
tNextBtn.addEventListener("click", upgradeHandler);

// Nächste Wave enquen
nextWaveButton.addEventListener("click", waveHandler);
// Spiel Pausieren
pauseButton.addEventListener("click", pauseHandler);
// Spiel bescheunigen
fastForwardButton.addEventListener("click", fastHandler);
// TowerMenu
showTowersBtn.addEventListener("click", ui.showMenu);
// Exit to Menu
exitBtn.addEventListener("click", ui.exitToMenu);