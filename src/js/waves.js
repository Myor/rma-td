"use strict";

var waves = game.waves = [];

waves[0] = [
    {num: 10, type: 0, delay: 5}
];

waves[1] = [
    {num: 10, type: 1, delay: 20}

];
waves[2] = [
    {num: 12, type: 2, delay: 10}
];

waves[3] = [
    {num: 15, type: 3, delay: 12}
];

//Red specs
waves[4] = [ 
    {num: 15, type: 4, delay: 8}
];

//red & black specs
waves[5] = [
    {num: 10, type: 4, delay: 2},
    {num: 10, type: 5, delay: 13}
];

waves[6] = [
    {num: 10, type: 7, delay: 5},
    {num: 10, type: 1, delay: 10},
    {num: 10, type: 2, delay: 10}
];

waves[7] = [
    {num: 10, type: 8, delay: 5},
    {num: 10, type: 1, delay: 10},
    {num: 10, type: 2, delay: 10}
];

waves[8] = [
    {num: 10, type: 0, delay: 5},
    {num: 10, type: 1, delay: 10},
    {num: 10, type: 2, delay: 10}
];


game.startNextWave = function () {
    if(game.currentWaveID >= game.waves.length) return;
    game.startWave(game.currentWaveID);
    game.updateRound();
    game.currentWaveID++;
};

game.startWave = function (id) {
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