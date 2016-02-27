"use strict";

var game = {};

game.resX = 384;
game.resY = 544;
game.cellSize = 32;
game.cellCenter = 16;
game.cellsX = 12; // = resX / cellSize
game.cellsY = 17; // = resY / cellSize
// Rechteck für einfach hit-tests
game.fieldRect = new PIXI.Rectangle(0, 0, game.cellsX, game.cellsY);


// ParticleContainer für gute Performance (wird auf GPU berechnet)
// Alle bekommen die gleichen Optionen, wegen PIXI Bug
// https://github.com/pixijs/pixi.js/issues/1953
var particleConOptions = {
    // scale wird bei den Mob-Lebensanzeigen gebraucht
    scale: true,
    position: true,
    rotation: true,
    // uvs, damit Texturen getauscht werden können
    uvs: true,
    alpha: false
};

var mainMenu = document.getElementById("mainMenu");
var exitBtn = document.getElementById("exitBtn");

game.setup = function () {
    mainMenu.style.display = "";
    mainMenu.addEventListener("click", function (e) {
        if (!e.target.matches("button")) return;

        game.map = game.maps[e.target.dataset.map];
        game.startGame();
    });

    exitBtn.addEventListener("click", function () {
        game.exitGame();
    });
    // Zum testen
    game.map = game.maps[0];
    game.startGame();
};

game.startGame = function () {

    game.setupTextures();

    game.life = 100;
    game.updateLife();
    game.cash = 2000;
    game.updateCash();
    // Waves
    game.currentWaveID = 0;
    game.isWaveActive = false;
    game.currentGroup = null;
    game.groupQueue = new Queue();
    game.currentDelay = 0;

    game.map.init();

    game.renderer = PIXI.autoDetectRenderer(game.resX, game.resY, {
        antialias: true
    });
    // Canvas in DOM rein
    game.canvasEl = game.renderer.view;
    document.getElementById("gameField").appendChild(game.canvasEl);

    // Werte für Berechnung von Input merken
    var rec = game.canvasEl.getBoundingClientRect();
    game.offsetX = rec.left;
    game.offsetY = rec.top;
    game.scale = game.resX / rec.width;

    game.collGrid = new CollisionGrid(game.cellsX, game.cellsY);

    var stage = new PIXI.Container();
    game.stage = stage;

    // Map
    game.mapCont = new PIXI.Container();

    // Pfad
    game.PFgrid = new PF.Grid(game.cellsX, game.cellsY);
    game.pathCont = new PIXI.Container();

    // Tower Kram
    game.shotCon = new PIXI.ParticleContainer(1000, particleConOptions, 1000);

    game.shockCon = new PIXI.ParticleContainer(100, particleConOptions, 100);

    game.towersCon = new PIXI.ParticleContainer(200, particleConOptions, 200);
    game.towers = new FastSet();

    // Grafik für Radius-anzeige
    game.selectCircleGr = new PIXI.Graphics();

    // Grafik beim Tower setzten
    // TODO könnte Grafik vom passenden Tower selber sein
    game.selectGr = new PIXI.Graphics();
    game.selectGr.beginFill(0xFFFFFF, 0.5);
    game.selectGr.drawRect(-game.cellCenter, -game.cellCenter, game.cellSize, game.cellSize);

    game.setSelectedTower(null);

    // Mob Kram
    game.mobsCon = new PIXI.ParticleContainer(50000, particleConOptions, 10000);
    game.mobsBarCon = new PIXI.ParticleContainer(50000, particleConOptions, 10000);
    game.mobs = new FastSet();
    game.mobQueue = new Queue();
    game.mobPool = new Pool(Mob, 10);

    // Alle Layer hinzufügen
    stage.addChild(game.mapCont);
    stage.addChild(game.pathCont);
    stage.addChild(game.selectCircleGr);
    stage.addChild(game.shotCon);
    stage.addChild(game.shockCon);
    stage.addChild(game.towersCon);
    stage.addChild(game.selectGr);
    stage.addChild(game.mobsCon);
    stage.addChild(game.mobsBarCon);

    game.fpsmeter = new PIXI.Text("0", {font: "16px Arial"});
    stage.addChild(game.fpsmeter);

//    game.testGr = new PIXI.Graphics();
//    stage.addChild(game.testGr);
//    game.testGr.beginFill(0xFF00FF);

    game.setupMap();
    // Map kann Pfad geändert haben
    game.path = game.findPath();
    game.drawPath();

    game.setupInput();
    game.startGameLoop();
//    game.lose();
};

game.exitGame = function () {
    game.stopGameLoop();
    // Aktive Aktionen abbrechen
    ui.endPlace();
    ui.hideMenu();
    game.setSelectedTower(null);

    // Stage mit allen Inhalten löschen
    // TODO hier werden auch texturen gelöscht, was bugs erzeugt :-/
    game.stage.destroy(true);
    game.stage = null;
    // Renderer mit Canvas löschen
    game.renderer.destroy(true);
    game.renderer = null;
    game.canvasEl = null;
    // Alle Referenzen auf Objekte löschen
    game.collGrid = null;

    game.map = null;
    game.mapCont = null;

    game.pathCont = null;

    game.shotCon = null;

    game.shockCon = null;

    game.towersCon = null;
    game.towers = null;

    game.selectCircleGr = null;

    game.selectGr = null;

    game.mobsCon = null;
    game.mobsBarCon = null;
    game.mobs = null;
    game.mobQueue = null;
    game.groupQueue = null;
    game.mobPool = null;

    game.fpsmeter = null;

    game.PFgrid = null;
    game.path = null;

};

game.setupTextures = function () {
    game.tex = {};

    game.tex.mobTexEmpty = texFromCache("mobs", 0, 0, 32, 32);
    game.tex.mobBarTex = texFromCache("mobBar", 0, 0, 32, 3);
    game.tex.mobBarTexEmpty = texFromCache("mobBar", 0, 6, 32, 4);

    mobTypes[0].tex = texFromCache("mobs", 33, 0, 32, 32);
    mobTypes[1].tex = texFromCache("mobs", 66, 0, 32, 32);
    mobTypes[2].tex = texFromCache("mobs", 99, 0, 32, 32);
    mobTypes[3].tex = texFromCache("mobs", 132, 0, 32, 32);
    mobTypes[4].tex = texFromCache("mobs", 165, 0, 32, 32);
    mobTypes[5].tex = texFromCache("mobs", 198, 0, 32, 32);
    mobTypes[6].tex = texFromCache("mobs", 231, 0, 32, 32);
    mobTypes[7].tex = texFromCache("mobs", 264, 0, 32, 32);
    mobTypes[8].tex = texFromCache("mobs", 297, 0, 32, 32);
    mobTypes[9].tex = texFromCache("mobs", 331, 0, 46, 32);


    towerTypes[0].tex = texFromCache("towers", 409, 0, 32, 32);
    towerTypes[1].tex = texFromCache("towers", 103, 0, 32, 32);
    towerTypes[1].tex2 = texFromCache("towers", 137, 0, 32, 32);
    towerTypes[2].tex = texFromCache("towers", 1, 0, 32, 32);
    towerTypes[3].tex = texFromCache("towers", 443, 0, 32, 32);
    towerTypes[4].tex = texFromCache("towers", 35, 0, 32, 32);
    towerTypes[4].tex2 = texFromCache("towers", 69, 0, 32, 32);
    towerTypes[5].tex = texFromCache("towers", 342, 0, 32, 32);
    towerTypes[5].tex2 = texFromCache("towers", 377, 0, 32, 32);
    towerTypes[6].tex = texFromCache("towers", 170, 0, 32, 32);
    towerTypes[6].texAnim = [
        texFromCache("towers", 170, 0, 32, 32),
        texFromCache("towers", 204, 0, 32, 32),
        texFromCache("towers", 238, 0, 32, 32),
        texFromCache("towers", 272, 0, 32, 32),
        texFromCache("towers", 306, 0, 32, 32)
    ];


    towerTypes[1].shotTex = texFromCache("shots", 1, 0, 1, 32);
    towerTypes[2].shotTex = texFromCache("shots", 6, 0, 1, 32);
    towerTypes[4].shotTex = texFromCache("shockwave");
    towerTypes[4].shotTex = texFromCache("shockwave");
    towerTypes[5].shotTex = [
        texFromCache("shots", 0, 32, 128, 32),
        texFromCache("shots", 0, 64, 128, 32),
        texFromCache("shots", 0, 96, 128, 32)
    ];

};
// Textur aus loader Cache lesen, mit frame
var texFromCache = function (img, x, y, w, h) {
    if (x !== undefined) {
        return new PIXI.Texture(
                PIXI.loader.resources[img].texture.baseTexture,
                new PIXI.Rectangle(x, y, w, h));
    } else {
        return new PIXI.Texture(PIXI.loader.resources[img].texture.baseTexture);
    }
};

game.setupMap = function () {
    var map = game.map;
    var cont = game.mapCont;

    game.renderer.backgroundColor = map.bgColor;

    /* === Background Textures === */
    var layout = map.groundLayout;
    for (var y = 0; y < game.cellsY; y++) {
        for (var x = 0; x < game.cellsX; x++) {
            var index = y * game.cellsX + x;
            var spr = new PIXI.Sprite(map.groundTex[layout[index]]);
            spr.position.x = utils.cell2Pos(x);
            spr.position.y = utils.cell2Pos(y);
            cont.addChild(spr);
        }
    }

    // Map ändert sich nicht, kann gecached werden
    cont.cacheAsBitmap = true;

    // Standard Tower
    var walls = map.walls;
    for (var i = 0; i < walls.length; i++) {
        game.addTowerAt(towerTypes[0], walls[i][0], walls[i][1]);
    }
    // Blockierte Zellen
    var locks = map.locks;
    for (var y = 0; y < game.cellsY; y++) {
        for (var x = 0; x < game.cellsX; x++) {
            var index = y * game.cellsX + x;
            if (locks[index] === 1) game.lockCell(x, y);
        }
    }
};

/* ==== Tower Radius Anzeige ==== */
var selectedTower = null;

game.drawSelectCircle = function (type) {
    game.selectCircleGr.clear();
    if (type.radius !== 0) {
        game.selectCircleGr.beginFill(0x000000, 0.3);
        game.selectCircleGr.drawCircle(0, 0, type.radius * game.cellSize);
    }
};
game.showSelection = function () {
    game.selectGr.visible = true;
    game.selectCircleGr.visible = true;
};
game.hideSelection = function () {
    game.selectGr.visible = false;
    game.selectCircleGr.visible = false;
};

game.getSelectedTower = function () {
    return selectedTower;
};

game.setSelectedTower = function (tower) {
    if (tower === null) {
        // Kreis ausblenden
        game.hideSelection();
        // Infos ausblenden
        ui.hideSelectedInfo();
    } else if (selectedTower !== tower) {
        console.log("select", tower);
        game.drawSelectCircle(tower.type);
        game.moveSelectionTo(tower.cx, tower.cy);
        // Kreis anzeigen
        game.showSelection();
        // Infos anzeigen
        ui.showSelectedInfo(tower);
    }
    selectedTower = tower;
};

game.moveSelectionTo = function (cx, cy) {
    game.selectGr.x = game.selectCircleGr.x = utils.cell2Pos(cx) + game.cellCenter;
    game.selectGr.y = game.selectCircleGr.y = utils.cell2Pos(cy) + game.cellCenter;
};
