"use strict";
// TODO Some more of dem sweet mobs!
var mobTypes = game.mobTypes = [];

// TODO Mob wird langsamer, je größer speed lol
// inverse verwenden oder so
mobTypes[0] = {
    name: "Test-Mob",
    desc: "blibla",
    price: 10,
    income: 1,
    life: 100,
    speed: 500,
    tex: null
};
mobTypes[1] = {
    name: "Test-Mob",
    desc: "blablub",
    price: 20,
    income: 2,
    life: 500,
    speed: 800,
    tex: null
};

// Konstruktor erstellt "unsichtbaren" Mob
var Mob = function () {
    this.spr = new PIXI.Sprite(game.tex.mobTexEmpty);
    this.spr.anchor.set(0.5);
    this.barSpr = new PIXI.Sprite(game.tex.mobBarTexEmpty);
    game.mobsCon.addChild(this.spr);
    game.mobsBarCon.addChild(this.barSpr);
};
// Alles leeren und sichtbar machen (textur tauschen)
Mob.prototype.init = function (type) {
    this.type = mobTypes[type];
    this.spr.texture = this.type.tex;
    this.barSpr.texture = game.tex.mobBarTex;
    this.life = this.type.life;
    this.cx = 0;
    this.cy = 0;
    this.x = 0;
    this.y = 0;
    this.dirX = 0;
    this.dirY = 0;
    this.covered = 0;
    this.age = 0;
};
// Unsichtbar machen
Mob.prototype.kill = function () {
    this.type = null;
    this.spr.texture = game.tex.mobTexEmpty;
    this.barSpr.texture = game.tex.mobBarTexEmpty;
};
// Komplett löschen
Mob.prototype.destroy = function () {
    this.type = null;
    game.mobsCon.removeChild(this.spr);
    game.mobsBarCon.removeChild(this.barSpr);
    this.spr.destroy();
    this.barSpr.destroy();
};
// Mob-daten bis age berechnen
Mob.prototype.simulateToAge = function (age) {
    // Zurückgelegter Weg
    var covered = age / this.type.speed;
    // In Zelle + Nachkommastelle (zum interpolieren) Teilen
    var cell = Math.floor(covered);
    var frac = covered - cell;
    // Zelle aus Pfad lesen
    var prevX, prevY, nextX, nextY;
    if (cell + 1 < game.path.length) {
        prevX = game.path[cell][0];
        prevY = game.path[cell][1];
        nextX = game.path[cell + 1][0];
        nextY = game.path[cell + 1][1];
    } else {
        prevX = nextX = game.path[game.path.length - 1][0];
        prevY = nextY = game.path[game.path.length - 1][1];
    }
    // Laufrichtung zur nächsten Zelle (-1 -> links, 0 -> gleich, 1 -> rechts)
    var dirX = nextX - prevX;
    var dirY = nextY - prevY;
    // Position = Zelle + Nachkomma * Laufrichtung
    this.x = utils.cell2Pos(prevX + frac * dirX);
    this.y = utils.cell2Pos(prevY + frac * dirY);
    // Speichern für weiteren Krams
    this.cx = prevX;
    this.cy = prevY;
    this.dirX = dirX;
    this.dirY = dirY;
    this.covered = covered;
};
// Daten auf Sprites setzten
Mob.prototype.update = function () {
    this.spr.x = this.x + game.cellCenter;
    this.spr.y = this.y + game.cellCenter;
    this.spr.rotation = utils.fastatan2(this.dirY, this.dirX);
    this.barSpr.x = this.x;
    this.barSpr.y = this.y;
    this.barSpr.scale.x = this.life / this.type.life;
};
// TODO muss sterben
Mob.prototype.hit = function (power) {
    this.life -= power;
    if(this.life < 0) this.life = 0;
};



var mobPool = new Pool(Mob, 10);
// TODO Mob sollten mit dem Update-loop gespawnt werden,
// vllt. Warteschlange verwenden
game.addMob = function (type) {
    var mob = mobPool.getObj();
    mob.init(type);
    game.mobs.add(mob);
};

game.removeMob = function (mob) {
    mob.kill();
    mobPool.returnObj(mob);
    game.mobs.remove(mob);
};


