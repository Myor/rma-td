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
    // Tower spawn
    towerPlaceBtns.addEventListener("click", placeHandler);
    towerCancelBtn.addEventListener("click", cancelHandler);
    towerSellBtn.addEventListener("click", sellHandler);

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

var mobSpawnBtns = document.getElementById("mobs");

var towerPlaceBtns = document.getElementById("towers");
var towerCancelBtn = document.getElementById("towerCancel");
var towerSellBtn = document.getElementById("towerSell");


var clickHandler = function (e) {
    // Nur bei Linksklick und wenn kein Tower gesetzt wird
    if (selectBlocked || e.button !== 0) return;
    var cx = utils.pos2Cell(e.offsetX);
    var cy = utils.pos2Cell(e.offsetY);
    game.setSelectedTower(game.getTowerAt(cx, cy));
};


var mobHandler = function (e) {
    if (!e.target.matches("button.mob")) return;
    var type = Number(e.target.dataset.type);
    console.log("spawn", type);
    game.addMob(type);
};


// ====== Tower Placing =======
// Maus und Touch haben getrennte Events, welche sich leicht unterschiedlich Verhalten :-/
var selectBlocked = false;

var placeBtn = null;
var placeType = 0;

var placeHandler = function (e) {
    // Nur bei Button klicks reagieren
    if (!e.target.matches("button.tower")) return;
    // Wenn setzen schon aktiv - beenden
    if (placeBtn !== null) endPlace();
    // Gewählten Tower merken
    placeBtn = e.target;
    placeType = Number(e.target.dataset.type);
    startPlace();
};
var cancelHandler = function () {
    endPlace();
};

var startPlace = function () {
    console.log("startplace", placeType);
    placeBtn.disabled = true;
    towerCancelBtn.disabled = false;
    addPlaceListeners();
    game.setSelectedTower(null);
    selectBlocked = true;
    game.drawSelectCircle(game.towerTypes[placeType]);
};

var endPlace = function () {
    console.log("endplace", placeType);
    towerCancelBtn.disabled = true;
    placeBtn.disabled = false;
    removePlaceListeners();
    game.selectGr.visible = false;
    game.selectCircleGr.visible = false;
    selectBlocked = false;
    placeBtn = null;
};

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
    game.selectGr.visible = true;
    game.selectCircleGr.visible = true;
    // Kreis und Platzhalter mitbewegen, wenn im Feld
    if (game.fieldRect.contains(cx, cy)) {
        game.selectGr.x = game.selectCircleGr.x = utils.cell2Pos(cx) + game.cellCenter;
        game.selectGr.y = game.selectCircleGr.y = utils.cell2Pos(cy) + game.cellCenter;
    }
};


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

