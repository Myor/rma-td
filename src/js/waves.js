"use strict";

var waves = game.waves = [];

waves[0] = {
    waveID: "1",
    spawnDelay: 10,
    waveComposition: [{num: 10, type: 0}]
};

waves[1] = {
    waveID: "2",
    spawnDelay: 10,
    waveComposition: [{num: 10, type: 1}]
};


game.startWave = function (id) {
    game.isWaveActive = true;
    var waveComp = waves[id].waveComposition;
    for (var i = 0; i < waveComp.length; i++) {
        for (var j = 0; j < waveComp[i].num; j++) {
            game.spawnMob(waveComp[i].type);
        }
    }
};
