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

// ParticleContainer für gute Performance (wird auf GPU berechnet)
// Alle bekommen die gleichen Optionen, wegen PIXI Bug
// https://github.com/pixijs/pixi.js/issues/1953
var particleConOptions = {
    // scale wird bei den Mob-Lebensanzeigen gebraucht
    scale: true,
    position: true,
    rotation: true,
    // uvs, damit Texturen getaucht werden können
    uvs: true,
    alpha: false
};

game.setup = function () {

    game.setupTextures();

    // TODO Mapauswahl
    game.map = map;

    game.renderer = PIXI.autoDetectRenderer(game.resX, game.resY, {
        antialias: false
    });
    // Canvas in DOM rein
    game.canvasEl = game.renderer.view;
    document.getElementById("gameField").appendChild(game.canvasEl);
    
    // Position für Input merken
    game.canvasoffsetX = game.canvasEl.offsetLeft;
    game.canvasoffsetY = game.canvasEl.offsetTop;

    game.collGrid = new CollisionGrid(game.cellsX, game.cellsY);

    game.stage = new PIXI.Container();

    game.drawMap();
    
    // Pfad Anzeige
    game.pathGr = new PIXI.Graphics();
    game.path = game.findPath();
    game.drawPath();
    
    // Tower Kram
    game.shotCon = new PIXI.ParticleContainer(1000, particleConOptions, 1000);
//    game.shotCon = new PIXI.Container();
    game.towersCon = new PIXI.ParticleContainer(200, particleConOptions, 200);
    game.towers = new FastSet();
    
    // Grafik für Radius-anzeige
    game.selectCircleGr = new PIXI.Graphics();
    game.selectCircleGr.visible = false;
    
    // Grafik beim Tower setzten
    // TODO könnte Grafik vom passenden Tower selber sein
    game.selectGr = new PIXI.Graphics();
    game.selectGr.beginFill(0xFFFFFF, 0.5);
    game.selectGr.drawRect(-game.cellCenter, -game.cellCenter, game.cellSize, game.cellSize);
    game.selectGr.visible = false;

    // Mob Kram
    game.mobsCon = new PIXI.ParticleContainer(50000, particleConOptions, 10000);
    game.mobsBarCon = new PIXI.ParticleContainer(50000, particleConOptions, 10000);
    game.mobs = new FastSet();
    
    // Alle Layer hinzufügen
    game.stage.addChild(game.pathGr);
    game.stage.addChild(game.selectCircleGr);
    game.stage.addChild(game.shotCon);
    game.stage.addChild(game.towersCon);
    game.stage.addChild(game.selectGr);
    game.stage.addChild(game.mobsCon);
    game.stage.addChild(game.mobsBarCon);

    game.fpsmeter = new PIXI.Text("0", {font: "14px Arial"});
    game.stage.addChild(game.fpsmeter);

    game.testGr = new PIXI.Graphics();
    game.stage.addChild(game.testGr);
    game.testGr.beginFill(0xFF00FF);

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

    game.tex.mobTexEmpty = texFromCache("img/mobs.png", 0, 0, 32, 32);
    game.tex.mobBarTex = texFromCache("img/mobBar.png", 0, 0, 32, 4);
    game.tex.mobBarTexEmpty = texFromCache("img/mobBar.png", 0, 6, 32, 4);
    
    mobTypes[0].tex = texFromCache("img/mobs.png", 34, 0, 32, 32);
    mobTypes[1].tex = texFromCache("img/mobs.png", 68, 0, 32, 32);


    towerTypes[0].tex = texFromCache("img/towers.png", 0, 0, 32, 32);
    towerTypes[1].tex = texFromCache("img/towers.png", 34, 0, 32, 32);
    towerTypes[2].tex = texFromCache("img/towers.png", 68, 0, 32, 32);
    towerTypes[3].tex = texFromCache("img/towers.png", 102, 0, 32, 32);
    
    towerTypes[1].shotTex = texFromCache("img/shots.png", 0, 0, 1, 32);
    towerTypes[2].shotTex = texFromCache("img/shots.png", 3, 0, 1, 32);
};
// Textur aus loader Cache lesen, mit frame
var texFromCache = function (img, x, y, w, h) {
    return new PIXI.Texture(
            PIXI.loader.resources[img].texture.baseTexture,
            new PIXI.Rectangle(x, y, w, h));
};

game.drawMap = function () {
    game.renderer.backgroundColor = game.map.bgColor;
    // TODO Hübsche Map malen

    /* ====== Grid ====== */
    var grid = new PIXI.Graphics();
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
    grid.cacheAsBitmap = true;

    game.stage.addChild(grid);
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
    var p = game.path;
    game.pathGr.clear();
    game.pathGr.beginFill(0x0000FF);
    var i;
    for (i = 0; i < p.length; i++) {
        game.pathGr.drawCircle(
                utils.cell2Pos(p[i][0]) + game.cellCenter,
                utils.cell2Pos(p[i][1]) + game.cellCenter, 3);
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

game.getSelectedTower = function () {
    return selectedTower;
};

game.setSelectedTower = function (tower) {
    if (tower === null) {
        game.selectCircleGr.visible = false;
    } else if (selectedTower !== tower) {
        console.log("select", tower);
        game.drawSelectCircle(tower.type);
        game.selectCircleGr.x = utils.cell2Pos(tower.cx) + game.cellCenter;
        game.selectCircleGr.y = utils.cell2Pos(tower.cy) + game.cellCenter;
        game.selectCircleGr.visible = true;
    }
    selectedTower = tower;
};

