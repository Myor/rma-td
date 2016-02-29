"use strict";

// Setzt Tower, wenn möglich
game.tryAddTowerAt = function (typeID, cx, cy) {
    // Tower vorhanden bzw. start & ziel
    if (game.collGrid.islockedAt(cx, cy)
            || game.collGrid.getTowerAt(cx, cy) !== null
            || utils.isStart(cx, cy)
            || utils.isFinish(cx, cy)) {
        return false;
    }
    var type = towerTypes[typeID];

    if (!game.hasCash(type.price)) return false;

    // Wenn Tower den Weg blockieren kann
    if (type.isBlocking) {
        // Weg neu berechnen
        game.PFgrid.setWalkableAt(cx, cy, false);
        var newPath = game.findPath();
        // Nur setzen, wenn Weg vorhanden
        if (newPath.length === 0) {
            game.PFgrid.setWalkableAt(cx, cy, true);
            return false;
        }
        game.path = newPath;
        game.drawPath();
    }
    game.removeCash(type.price);
    game.addTowerAt(type, cx, cy);
    return true;
};

// Setzt Tower ohne Einschränkungen zu prüfen
game.addTowerAt = function (type, cx, cy) {

    var tower = new Tower(type, cx, cy);
    game.towers.add(tower);

    if (isBuffTower(tower)) {
        game.buffColGrid.addTower(tower);
    }
    game.collGrid.addTower(tower);


    game.calculateBuffs();

    // Blockieren, wenn nötig
    if (type.isBlocking) {
        game.PFgrid.setWalkableAt(cx, cy, false);
    }

    return tower;
};

// Tower für Zelle finden, null wenn keiner vorhanden
game.getTowerAt = function (cx, cy) {
    if (game.fieldRect.contains(cx, cy) && !game.collGrid.islockedAt(cx, cy)) {
        return game.collGrid.getTowerAt(cx, cy);
    }
    return null;
};

game.sellTower = function (tower) {
    // Pfad freigeben
    if (tower.type.isBlocking) {
        game.PFgrid.setWalkableAt(tower.cx, tower.cy, true);
        game.path = game.findPath();
        game.drawPath();
    }
    game.addCash(tower.type.sellPrice);
    game.deleteTower(tower);
};

game.deleteTower = function (tower) {
    if (isBuffTower(tower)) {
        // Wenn Bufftower enternt - Buffs neu berechnen
        game.buffColGrid.deleteTower(tower);
        game.calculateBuffs();
    }
    game.collGrid.deleteTower(tower);

    game.towers.remove(tower);

    // Aufräumen
    tower.destroy();
};

game.upgradeTower = function (tower) {
    var nextType = tower.type.next;

    if (!game.hasCash(nextType.price)) return;
    game.removeCash(nextType.price);

    game.deleteTower(tower);
    return game.addTowerAt(nextType, tower.cx, tower.cy);
};


game.calculateBuffs = function () {
    var towers = game.towers.getArray();
    var tower;
    var buffTowers;
    for (var i = 0; i < towers.length; i++) {
        tower = towers[i];
        if (!isBuffTower(towers)) {
            tower.powerMulti = 1;
            tower.freqMulti = 1;
            tower.radiusMulti = 1;

            buffTowers = game.buffColGrid.getCollisionsAt(tower.cx, tower.cy).getArray();

            for (var j = 0; j < buffTowers.length; j++) {
                if ("powerAdd" in buffTowers[j].type) {
                    tower.powerMulti += buffTowers[j].type.powerAdd;
                }
                if ("freqAdd" in buffTowers[j].type) {
                    tower.freqMulti += buffTowers[j].type.freqAdd;
                }
                if ("radiusAdd" in buffTowers[j].type) {
                    tower.radiusMulti += buffTowers[j].type.radiusAdd;
                }
            }
        }
    }
};

var randomTowers = function () {
    var i, j;
    for (i = 0; i < game.cellsX; i++) {
        for (j = 0; j < game.cellsY; j++) {
            if (Math.random() > 0.70) {
                game.tryAddTowerAt(1, i, j);
            }
        }
    }
};

var isBuffTower = function (tower) {
    return tower.type === towerTypes[6];
};

// Allgemeiner Tower Konstruktor
var Tower = function (type, cx, cy) {
    this.type = type;
    this.killCount = 0;

    this.cx = cx;
    this.cy = cy;
    this.x = utils.cell2Pos(cx);
    this.y = utils.cell2Pos(cy);

    this.radiusMulti = 1;
    this.freqMulti = 1;
    this.powerMulti = 1;

    this.spr = new PIXI.Sprite(this.type.tex);
    this.spr.anchor.set(0.5);
    this.spr.x = this.x + game.cellCenter;
    this.spr.y = this.y + game.cellCenter;

    game.towersCon.addChild(this.spr);
    type.init.call(this);
    Object.assign(this, type.extend);
};

Tower.prototype.destroy = function () {
    game.towersCon.removeChild(this.spr);
    this.spr.destroy();
};
// Funktionen, welche alle Tower teilen
Tower.prototype.isInRadius = function (dist) {
    return dist <= utils.cell2Pos(this.type.radius);
};
Tower.prototype.angleToMob = function (mob) {
    return Math.atan2(mob.y - this.y, mob.x - this.x);
};
Tower.prototype.getFreq = function () {
    return this.type.freq * this.freqMulti;
};
Tower.prototype.getPower = function () {
    return this.type.power * this.powerMulti;
};
// Default noops
Tower.prototype.update = function () {};
Tower.prototype.beforeCollide = function () {};
Tower.prototype.collide = function () {};
Tower.prototype.afterCollide = function () {};
Tower.prototype.aimFunc = null;

// Funktionen zum Anvisieren von Mobs
var aimFuncs = {};

aimFuncs.first = function (mob, dist) {
    return this.focus === null || mob.covered > this.focus.covered;
};
aimFuncs.last = function (mob, dist) {
    return this.focus === null || mob.covered < this.focus.covered;
};
aimFuncs.strong = function (mob, dist) {
    return this.focus === null || mob.life > this.focus.life;
};
aimFuncs.weak = function (mob, dist) {
    return this.focus === null || mob.life < this.focus.life;
};
aimFuncs.close = function (mob, dist) {
    return this.focus === null || dist < this.dist;
};
// Namen zur Zuordnung im Menü
aimFuncs.first.id = "first";
aimFuncs.last.id = "last";
aimFuncs.strong.id = "strong";
aimFuncs.weak.id = "weak";
aimFuncs.close.id = "close";

