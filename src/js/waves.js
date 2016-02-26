"use strict"

var waves = [];

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

game.startWave = function (wave) { // start wave number waveNr
	for each(comp in wave.waveComposition){
		for(var i = 0; i<comp.num){
			game.spawnMob(comp.type);
		}
	}
};

game.getWaveArray = function () {
	return waves;
};