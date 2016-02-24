"use strict";

var game = {};

game.resX = 320;
game.resY = 480;
game.cellSize = 32;
game.cellCenter = 16;
game.cellsX = 10; // = resX / cellSize
game.cellsY = 15; // = resY / cellSize
// Rechteck für einfach hit-tests
game.fieldRect = new PIXI.Rectangle(0, 0, game.cellsX, game.cellsY);

// TODO Verschiedene Maps
var map = {};
map.start = new PIXI.Point(2, 0);
map.finish = new PIXI.Point(6, 14);
map.bgColor = 0xD3D3D3;
map.walls = [[1, 2], [2, 2], [3, 2], [4, 2], [7, 5], [6, 5], [5, 5], [4, 5], [2, 8], [3, 8], [4, 8], [4, 9], [4, 10], [4, 1], [3, 5]];

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

game.setup = function () {

    game.setupTextures();
    
    game.life = 100;
    game.updateLife();

    // TODO Mapauswahl
    game.map = map;

    game.renderer = PIXI.autoDetectRenderer(game.resX, game.resY, {
        antialias: true
    });
    // Canvas in DOM rein
    game.canvasEl = game.renderer.view;
    document.getElementById("gameField").appendChild(game.canvasEl);

    // Position für Input merken
    game.canvasoffsetX = game.canvasEl.offsetLeft;
    game.canvasoffsetY = game.canvasEl.offsetTop;

    game.collGrid = new CollisionGrid(game.cellsX, game.cellsY);

    var stage = new PIXI.Container();
    game.stage = stage;

    // Map
    game.mapCont = new PIXI.Container();

    // Pfad
    game.pathCont = new PIXI.Container();
    game.path = game.findPath();
    game.drawPath();

    // Tower Kram
    game.shotCon = new PIXI.ParticleContainer(1000, particleConOptions, 1000);
//    game.shotCon = new PIXI.Container();
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

    // Alle Layer hinzufügen
    stage.addChild(game.mapCont);
    stage.addChild(game.pathCont);
    stage.addChild(game.selectCircleGr);
    stage.addChild(game.shotCon);
    stage.addChild(game.towersCon);
    stage.addChild(game.selectGr);
    stage.addChild(game.mobsCon);
    stage.addChild(game.mobsBarCon);

    game.fpsmeter = new PIXI.Text("0", {font: "16px Arial"});
    stage.addChild(game.fpsmeter);

    game.testGr = new PIXI.Graphics();
    stage.addChild(game.testGr);
    game.testGr.beginFill(0xFF00FF);

    game.setupMap();
    game.setupInput();
    game.startGameLoop();
};

//game.cleanup = function () {
//    game.map = null;
//    game.renderer.destroy(true);
//    game.renderer = null;
//    game.stage.destroy(true);
//    game.stage = null;
//    game.collGrid = null;
//};

game.setupTextures = function () {
    game.tex = {};

    game.tex.mobTexEmpty = texFromCache("mobs", 0, 0, 32, 32);
    game.tex.mobBarTex = texFromCache("mobBar", 0, 0, 32, 4);
    game.tex.mobBarTexEmpty = texFromCache("mobBar", 0, 6, 32, 4);

    mobTypes[0].tex = texFromCache("mobs", 34, 0, 32, 32);
    mobTypes[1].tex = texFromCache("mobs", 68, 0, 32, 32);


    towerTypes[0].tex = texFromCache("towers", 0, 0, 32, 32);
    towerTypes[1].tex = texFromCache("towers", 34, 0, 32, 32);
    towerTypes[2].tex = texFromCache("towers", 68, 0, 32, 32);
    towerTypes[3].tex = texFromCache("towers", 102, 0, 32, 32);

    towerTypes[1].shotTex = texFromCache("shots", 0, 0, 1, 32);
    towerTypes[2].shotTex = texFromCache("shots", 3, 0, 1, 32);

};
// Textur aus loader Cache lesen, mit frame
var texFromCache = function (img, x, y, w, h) {
    if (x !== undefined) {
        return new PIXI.Texture(
                PIXI.loader.resources[img].texture.baseTexture,
                new PIXI.Rectangle(x, y, w, h));
    } else {
        return PIXI.loader.resources[img].texture;
    }
};

game.setupMap = function () {
    game.renderer.backgroundColor = game.map.bgColor;
    // TODO Hübsche Map malen

    var cont = game.mapCont;
    var grid = new PIXI.Graphics();
    cont.addChild(grid);

    /* ====== Grid ====== */
    grid.alpha = 0.5;
    grid.lineStyle(1, 0x000000);
    // Alle cellSize Pixel eine Linie
    var i;
    for (i = game.cellSize; i < game.resX; i += game.cellSize) {
        grid.moveTo(i, 0);
        grid.lineTo(i, game.resY);
    }
    for (i = game.cellSize; i < game.resY; i += game.cellSize) {
        grid.moveTo(0, i);
        grid.lineTo(game.resX, i);
    }
    // Start und Ziel Felder
    grid.lineStyle(0);
    grid.beginFill(0x00FFFF);
    grid.drawRect(
            utils.cell2Pos(game.map.start.x),
            utils.cell2Pos(game.map.start.y),
            game.cellSize,
            game.cellSize);
    grid.beginFill(0xFF0000);
    grid.drawRect(
            utils.cell2Pos(game.map.finish.x),
            utils.cell2Pos(game.map.finish.y),
            game.cellSize,
            game.cellSize);
    // Map ändert sich nicht, kann gecached werden
    cont.cacheAsBitmap = true;
    /* ===== Standard Tower ==== */
    var walls = game.map.walls;
    for (i = 0; i < walls.length; i++) {
        // TODO pfad hier nur ein mal neu berechnen
        game.addTowerAt(0, walls[i][0], walls[i][1]);
    }
};

/* ===== Path finding ===== */

var PFfinder = new PF.AStarFinder({
    allowDiagonal: false,
    heuristic: PF.Heuristic.manhattan
});

game.PFgrid = new PF.Grid(game.cellsX, game.cellsY);

game.findPath = function () {
    return PFfinder.findPath(
            game.map.start.x,
            game.map.start.y,
            game.map.finish.x,
            game.map.finish.y,
            game.PFgrid.clone());
};
game.path = null;

game.drawPath = function () {
    var path = game.path;
    var cont = game.pathCont;
    var tex = texFromCache("pathMark");
    var spr = null;
    var i;
    // Alte Sprites löschen
    for (i = 0; i < cont.children.length; i++) {
        cont.children[i].destroy();
    }
    cont.removeChildren();
    // Pfad malen
    for (var i = 0; i < path.length; i++) {
        spr = new PIXI.Sprite(tex);
        spr.x = utils.cell2Pos(path[i][0]);
        spr.y = utils.cell2Pos(path[i][1]);
        cont.addChild(spr);
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
