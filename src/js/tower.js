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

    // Wenn Tower den Weg blockieren kann
    if (towerTypes[typeID].isBlocking) {
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

    game.addTowerAt(typeID, cx, cy);
};

// Setzt Tower ohne Einschränkungen zu prüfen
game.addTowerAt = function (typeID, cx, cy) {

    var tower = new Tower(towerTypes[typeID], cx, cy);

    game.towers.add(tower);
    game.collGrid.addTower(tower);
    game.PFgrid.setWalkableAt(cx, cy, false);

    return true;
};

// Tower für Zelle finden, null wenn keiner vorhanden
game.getTowerAt = function (cx, cy) {
    if (game.fieldRect.contains(cx, cy) && !game.collGrid.islockedAt(cx, cy)) {
        return game.collGrid.getTowerAt(cx, cy);
    }
    return null;
};

game.sellTower = function (tower) {

    game.PFgrid.setWalkableAt(tower.cx, tower.cy, true);
    game.path = game.findPath();
    game.drawPath();

    game.towers.remove(tower);

    game.collGrid.deleteTower(tower);

    tower.destroy();
};

var randomTowers = function () {
    var i, j;
    for (i = 0; i < game.cellsX; i++) {
        for (j = 0; j < game.cellsY; j++) {
            if (Math.random() > 0.70) {
                game.addTowerAt(1, i, j);
            }
        }
    }
};

// Allgemeiner Tower Konstruktor
var Tower = function (type, cx, cy) {
    this.type = type;
    this.killCount = 0;

    this.cx = cx;
    this.cy = cy;
    this.x = utils.cell2Pos(cx);
    this.y = utils.cell2Pos(cy);

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
Tower.prototype.update = function () {};
Tower.prototype.beforeCollide = function () {};
Tower.prototype.collide = function () {};
Tower.prototype.afterCollide = function () {};


var towerTypes = game.towerTypes = [];

towerTypes[0] = {
    name: "Wall",
    desc: "Helps you maze.",
    isBlocking: true,
    radius: 0,
    price: 10,
    sellPrice: 5,
    tex: null,
    init: function () {}
};

towerTypes[1] = {
    name: "Laser Tower",
    desc: "Standard Laser Tower",
    isBlocking: true,
    radius: 4,
    price: 100,
    sellPrice: 50,
    tex: null,
    shotTex: null,
    power: 10,
    freq: 3,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.type.freq;

        this.shotSpr = new PIXI.Sprite(this.type.shotTex);
        this.shotSpr.anchor.set(0, 0.5);
        this.shotSpr.x = this.x + game.cellCenter;
        this.shotSpr.y = this.y + game.cellCenter;
        game.shotCon.addChild(this.shotSpr);
    },
    extend: {
        destroy: function () {
            Tower.prototype.destroy.call(this);
            game.shotCon.removeChild(this.shotSpr);
            this.shotSpr.destroy();
        },
        update: function (time) {
            if (this.focus === null) {
                this.shotSpr.scale.set(0);
            } else {
                this.shotSpr.scale.y = Math.sin(time / 50) * 0.25 + 0.75;
            }
        },
        beforeCollide: function () {
            this.reload--;
            this.focus = null;
            this.dist = 0;
        },
        collide: function (mob, dist) {
            if (this.reload !== 0) return;

            if (dist <= utils.cell2Pos(this.type.radius)) {
                if (this.focus === null) {
                    this.focus = mob;
                    this.dist = dist;
                } else if (mob.covered > this.focus.covered) {
                    this.focus = mob;
                    this.dist = dist;
                }
            }
        },
        afterCollide: function () {
            if (this.reload === 0) {
                this.reload = this.type.freq;
            }
            if (this.focus !== null) {
                this.focus.hit(this.type.power, this);
                this.spr.rotation = this.shotSpr.rotation = Math.atan2(this.focus.y - this.y, this.focus.x - this.x);
                this.shotSpr.scale.x = this.dist;
            }
        }
    }

};

towerTypes[2] = {
    name: "Sharpshooter",
    desc: "Slow Long Range Attack",
    isBlocking: true,
    radius: 7,
    price: 500,
    sellPrice: 300,
    tex: null,
    shotTex: null,
    power: 50,
    freq: 50,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.type.freq;

        this.shotSpr = new PIXI.Sprite(this.type.shotTex);
        this.shotSpr.anchor.set(0, 0.5);
        this.shotSpr.x = this.x + game.cellCenter;
        this.shotSpr.y = this.y + game.cellCenter;
        game.shotCon.addChild(this.shotSpr);
    },
    extend: {
        destroy: function () {
            Tower.prototype.destroy.call(this);
            game.shotCon.removeChild(this.shotSpr);
            this.shotSpr.destroy();
        },
        update: function (time) {
            if (this.focus === null) {
                this.shotSpr.scale.set(0);
            } else {
                this.shotSpr.scale.y = Math.sin(time / 50) * 0.25 + 0.75;
            }
        },
        beforeCollide: function () {
            this.reload--;
            this.focus = null;
            this.dist = 0;
        },
        collide: function (mob, dist) {
            if (this.reload !== 0) return;

            if (dist <= utils.cell2Pos(this.type.radius)) {
                if (this.focus === null) {
                    this.focus = mob;
                    this.dist = dist;
                } else if (mob.covered > this.focus.covered) {
                    this.focus = mob;
                    this.dist = dist;
                }
            }
        },
        afterCollide: function () {
            if (this.reload === 0) {
                this.reload = this.type.freq;
            }
            if (this.focus !== null) {
                this.focus.hit(this.type.power, this);
                this.spr.rotation = this.shotSpr.rotation = Math.atan2(this.focus.y - this.y, this.focus.x - this.x);
                this.shotSpr.scale.x = this.dist;
            }
        }
    }
};

towerTypes[3] = {
    name: "Spikes",
    desc: "Can be placed on creep path. Will damage on contact.",
    isBlocking: false,
    radius: 0.4,
    price: 100,
    sellPrice: 10,
    tex: null,
    power: 10,
    init: function () {},
    extend: {
        collide: function (mob, dist) {
            mob.hit(this.type.power, this);
        }
    }
};

towerTypes[4] = {
    name: "AoE Tower",
    desc: "Damages all Creeps in the Radius",
    isBlocking: true,
    radius: 1.5,
    price: 100,
    sellPrice: 10,
    tex: null,
    power: 100,
    freq: 20,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.type.freq;
        this.shooting = false;
        this.scaling=false;
        this.shotSpr = new PIXI.Sprite(this.type.shotTex);
        this.shotSpr.anchor.set(0.5, 0.5);
        this.shotSpr.x = this.x + game.cellCenter;
        this.shotSpr.y = this.y + game.cellCenter;
        this.shotSpr.scale.set(0.1);

        game.shockCon.addChild(this.shotSpr);
    },
    extend: {
        destroy: function () {
            Tower.prototype.destroy.call(this);
            game.shotCon.removeChild(this.shotSpr);
            this.shotSpr.destroy();
        },
        update: function (time) {
            if(this.shooting){
                this.scaling = true;
                this.shotSpr.scale.x += 0.05;
                this.shotSpr.scale.y +=0.05;
                if(this.shotSpr.scale.x > 1){
                    this.shotSpr.scale.set(0);
                    this.shooting = false;
                }

            }
        },
        beforeCollide: function () {
            this.reload--;
        },
        collide: function (mob, dist) {
            if (this.reload !== 0) return;

            if (dist <= utils.cell2Pos(this.type.radius)) {
                if(!this.shooting)
                    this.shooting = true;

                console.log("Im qoe colllide");
                mob.hit(this.type.power, this);
            }
        },
        afterCollide: function () {
            if (this.reload === 0) {
                this.reload = this.type.freq;
            }
        }
    }
};