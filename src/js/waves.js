"use strict";

var waves = game.waves = [];

waves[0] = [
    {num: 10, type: 0, delay: 5},
    {num: 10, type: 1, delay: 0}
];

waves[1] = [
    {num: 10, type: 0, delay: 5},
    {num: 10, type: 1, delay: 10},
    {num: 10, type: 2, delay: 10}
];

game.startNextWave = function () {
    game.startWave(game.currentWaveID + 1);
};

game.startWave = function (id) {
    game.currentWaveID = id;
    game.isWaveActive = true;
    var groups = waves[id];
    for (var i = 0; i < groups.length; i++) {
        game.groupQueue.enqueue(groups[i]);
    }
};


game.updateWave = function () {
    if (!game.isWaveActive) return;

    if (game.mobQueue.isEmpty()) {
        if (game.groupQueue.isEmpty()) {
            if (game.mobs.isEmpty()) {
                // Nichts mehr in den Queues und alle Mobs tot
                console.log("wave done");
                game.isWaveActive = false;
            }
        } else {
            // Mobs aus groupQueue nachfüllen
            game.currentGroup = game.groupQueue.dequeue();
            game.currentDelay = game.currentGroup.delay;
            game.enqueMobs(game.currentGroup.type, game.currentGroup.num);
        }
    } else {
        // Mob mit delay spawnen
        if (--game.currentDelay < 0) {
            game.currentDelay = game.currentGroup.delay;
            game.addMob(game.mobQueue.dequeue());
        }
    }
};