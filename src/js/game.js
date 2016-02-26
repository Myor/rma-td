"use strict";

PIXI.loader
        .add("mobs", "assets/mobs.png")
        .add("mobBar", "assets/mobBar.png")
        .add("towers", "assets/towerSheet32.png")
        .add("shots", "assets/shots.png")
        .add("pathMark", "assets/pathOverlay.png")
        .add("map1ground", "assets/map1ground32.png")
        .add("map2ground", "assets/map2ground32.png")
        .add("shockwave", "assets/shockwave.png")
        .load(game.setup);


/* ==== Loops === */

var accumulator = 0; // Sammelt die Frame-Zeiten
var passed = 0; // Summe aller Frame-Zeiten
var step = 50; // Fester Simulationsschritt
var slowFactor = 1; // Slow-motion Faktor
var slowStep = step * slowFactor;
var lastTime = 0;

var frameId;
// Game-loop
// http://gafferongames.com/game-physics/fix-your-timestep/
// http://codeincomplete.com/posts/2013/12/4/javascript_game_foundations_the_game_loop/

var initFrame = function (newTime) {
    lastTime = newTime;
    requestAnimationFrame(frame);
};

var frame = function (newTime) {

    var frameTime = newTime - lastTime;
    if (frameTime > 500) {
        // Spikes abfangen
        frameTime = 500;
        console.warn("clamp frameTime");
    }
    lastTime = newTime;
    accumulator += frameTime;
    passed += frameTime;

    while (accumulator >= slowStep) {
        simulate(step);

        accumulator -= slowStep;

        game.fpsmeter.text = (1000 / frameTime) | 0;
    }

    updateAnimation(passed / slowFactor, accumulator / slowFactor);

    game.renderer.render(game.stage);
    frameId = requestAnimationFrame(frame);
};

game.startGameLoop = function () {
    requestAnimationFrame(initFrame);
};
game.stopGameLoop = function () {
    cancelAnimationFrame(frameId);
};


// Physik update / Kollisionsabfragen
var simulate = function (dt) {
    var i, j, tower, mob, dist, collArray;
    var towers = game.towers.getArray();
    var mobs = game.mobs.getArray();
    var wave = game.waves[game.wave];

    // Ein Mob pro Update spawnen
    if (!game.mobQueue.isEmpty()) {
        game.addMob(game.mobQueue.dequeue());
    }{
        game.wave++;
        game.startWave(game.wave);
    }

    for (i = 0; i < towers.length; i++) {
        tower = towers[i];
        tower.beforeCollide();
    }

    for (i = 0; i < mobs.length; i++) {
        mob = mobs[i];

        mob.age += dt;
        mob.simulateToAge(mob.age);
        
        if(utils.isFinish(mob.cx, mob.cy)) {
            game.hit(1);
            mob.kill();
            continue;
        }

//        game.testGr.drawCircle(mob.x + game.cellCenter, mob.y + game.cellCenter, 1);

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

game.hit = function (power) {
    game.life -= power;
    if(game.life <= 0) {
        console.log("verloren");
    }
    game.updateLife();
};

game.heal = function (power) {
    game.life += power;
    if(game.life > 100) game.life = 100;
    game.updateLife();
};

var gamelifeEl = document.getElementById("gameLife");

game.updateLife = function () {
    gamelifeEl.textContent = game.life;
};
