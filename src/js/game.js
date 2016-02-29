"use strict";

var loadResources = function () {
    PIXI.loader
            .add("mobs", "assets/mobSheet32.png")
            .add("mobBar", "assets/mobBar.png")
            .add("towers", "assets/towerSheet32.png")
            .add("shots", "assets/shots@2x.png")
            .add("pathMark", "assets/pathMarker.png")
            .add("map1ground", "assets/map1ground32.png")
            .add("map2ground", "assets/map2ground32.png")
            .add("shockwave", "assets/shockwave.png")
            .load(game.setup);
};

var cordovaSetup = function () {
    // Zurück-Button deaktivieren
    document.addEventListener("backbutton", function (e) {
        e.preventDefault();
    });
    // Beim minimieren der App pausieren
    document.addEventListener("pause", ui.pauseGame);
    // Vibration API
    ui.canVibrate = window.navigator.vibrate !== undefined;
    
    loadResources();
};

if (window.cordova !== undefined) {
    // In Cordova App auf deviceready warten
    document.addEventListener("deviceready", cordovaSetup);
} else {
    // Im Browser
    loadResources();
}

/* ==== Loops === */

var accumulator = 0; // Sammelt die Frame-Zeiten
var passed = 0; // Summe aller Frame-Zeiten
var step = 50; // Fester Simulationsschritt
var slowFactor = 1; // Slow-motion Faktor
var lastTime = 0;

var frameId;


// Game-loop
// http://gafferongames.com/game-physics/fix-your-timestep/
// http://codeincomplete.com/posts/2013/12/4/javascript_game_foundations_the_game_loop/

var initGameloop = function (newTime) {
    lastTime = newTime;
    game.renderer.render(game.stage);
    frameId = requestAnimationFrame(gameloop);
};
// Loop mit allen updates
var gameloop = function (newTime) {
    var slowStep = step * slowFactor;

    var frameTime = newTime - lastTime;
    if (frameTime > 500) {
        // Spikes abfangen
        frameTime = 500;
    }
    lastTime = newTime;
    accumulator += frameTime;
    passed += frameTime;

    while (accumulator >= slowStep) {
        simulate(step);

        accumulator -= slowStep;
    }

    updateAnimation(passed / slowFactor, accumulator / slowFactor);


    game.renderer.render(game.stage);
    frameId = requestAnimationFrame(gameloop);
};
// Loop nur zum rendern der Stage
var renderloop = function () {
    game.renderer.render(game.stage);
    frameId = requestAnimationFrame(renderloop);
};

game.startGameLoop = function () {
    requestAnimationFrame(initGameloop);
};
game.stopGameLoop = function () {
    cancelAnimationFrame(frameId);
};

game.pauseLoop = function () {
    game.isPaused = true;
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(renderloop);
};
game.resumeLoop = function () {
    game.isPaused = false;
    cancelAnimationFrame(frameId);
    game.startGameLoop();
};

// Physik update / Kollisionsabfragen
var simulate = function (dt) {
    var i, j, tower, mob, dist, collArray;
    var towers = game.towers.getArray();
    var mobs = game.mobs.getArray();

    game.updateWave();

    for (i = 0; i < towers.length; i++) {
        tower = towers[i];
        tower.beforeCollide();
    }

    for (i = 0; i < mobs.length; i++) {
        mob = mobs[i];

        mob.age += dt;
        mob.simulateToAge(mob.age);

        if (utils.isFinish(mob.cx, mob.cy)) {
            game.hit(1);
            mob.kill();
            continue;
        }

        collArray = game.collGrid.getCollisionsAt(mob.cx, mob.cy).getArray();

        for (j = 0; j < collArray.length; j++) {
            tower = collArray[j];

            dist = utils.dist(tower.x - mob.x, tower.y - mob.y);
            tower.collide(mob, dist);
        }

    }
    for (i = 0; i < towers.length; i++) {
        tower = towers[i];
        tower.afterCollide();
    }
    // Killed Mobs entfernen
    // Rückwärts, um keine Elemente zu überspringen
    for (i = mobs.length - 1; i >= 0; i--) {
        mob = mobs[i];
        if (mob.isKilled()) {
            game.removeMob(mob);
        }
    }
};

// Grafik update
var updateAnimation = function (time, accumulator) {
    var mobs = game.mobs.getArray();
    var i;
    var mob;
    for (i = 0; i < mobs.length; i++) {
        mob = mobs[i];
        mob.simulateToAge(mob.age + accumulator);
        mob.update();

    }
    var towers = game.towers.getArray();
    var tower;
    for (i = 0; i < towers.length; i++) {
        tower = towers[i];
        tower.update(time);
    }

};

var gamelifeEl = document.getElementById("gameLife");
var gameCashEl = document.getElementById("gameCash");
var gameRoundEl = document.getElementById("gameRound");

var colorMatrix = new PIXI.filters.ColorMatrixFilter();
//colorMatrix.brightness(1.5);
colorMatrix.blackAndWhite();

var blur = new PIXI.filters.BlurFilter();
blur.blur = 3;


game.lose = function () {
    if (game.isLost) return;
    game.isLost = true;
    slowFactor = 2;
    game.stage.filters = [colorMatrix, blur];
    ui.loseGame();
};

game.win = function () {
    if(game.isLost) return;
    ui.winGame();
};


// ==== Game Life ====
game.hit = function (power) {
    game.life -= power;
    if (game.life <= 0) {
        game.life = 0;
        game.lose();
    }
    game.updateLife();
    if(ui.canVibrate) navigator.vibrate(40);
};

game.heal = function (power) {
    game.life += power;
    if (game.life > 100) game.life = 100;
    game.updateLife();
};

game.updateLife = function () {
    gamelifeEl.textContent = game.life;
};

// ==== Game Cash ====
game.addCash = function (c) {
    game.cash += c;
    game.updateCash();
};

game.hasCash = function (price) {
    return game.cash >= price;
};

game.removeCash = function (c) {
    game.cash -= c;
    game.updateCash();
};

game.updateCash = function () {
    gameCashEl.textContent = game.cash;
};

// ==== Game Wave ====
game.updateRound = function () {
    if (game.currentWaveID === -1) {
        gameRoundEl.textContent = "";
    } else {
        gameRoundEl.textContent = game.currentWaveID + "/" + (game.waves.length - 1);
    }
};