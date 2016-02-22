"use strict";

PIXI.loader
        .add("mobs", "img/mobs.png")
        .add("mobBar", "img/mobBar.png")
        .add("towers", "img/towers@2x.png")
        .add("shots", "img/shots.png")
        .add("pathMark", "img/pathMark@2x.png")
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
    requestAnimationFrame(frame, performance.now());
};
game.stopGameLoop = function () {
    cancelAnimationFrame(frameId);
};


// Physik update / Kollisionsabfragen
var simulate = function (dt) {
    var i, j, tower, mob, dist, collArray;
    var towers = game.towers.getArray();
    var mobs = game.mobs.getArray();

    for (i = 0; i < towers.length; i++) {
        tower = towers[i];
        tower.beforeCollide();
    }

    for (i = 0; i < mobs.length; i++) {
        mob = mobs[i];

        mob.age += dt;
        mob.simulateToAge(mob.age);

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
