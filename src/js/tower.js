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

    if(!game.hasCash(type.price)) return;
    
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
};

// Setzt Tower ohne Einschränkungen zu prüfen
game.addTowerAt = function (type, cx, cy) {

    var tower = new Tower(type, cx, cy);
    game.towers.add(tower);
    game.collGrid.addTower(tower);
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
    game.PFgrid.setWalkableAt(tower.cx, tower.cy, true);
    game.path = game.findPath();
    game.drawPath();
    game.addCash(tower.type.sellPrice);
    game.deleteTower(tower);
};

game.deleteTower = function (tower) {
    // Aus Kollisionsberechnung entfernen
    game.towers.remove(tower);
    game.collGrid.deleteTower(tower);
    // Aufräumen
    tower.destroy();
};

game.upgradeTower = function (tower) {
    var nextType = tower.type.next;

    if(!game.hasCash(nextType.price)) return;
    game.removeCash(nextType.price);
    
    game.deleteTower(tower);
    return game.addTowerAt(nextType, tower.cx, tower. cy);
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
Tower.prototype.isInRadius = function (dist) {
    return dist <= utils.cell2Pos(this.type.radius);
};
Tower.prototype.angleToMob = function (mob) {
    return Math.atan2(mob.y - this.y, mob.x - this.x);
};
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

aimFuncs.first.id = "first";
aimFuncs.last.id = "last";
aimFuncs.strong.id = "strong";
aimFuncs.weak.id = "weak";
aimFuncs.close.id = "close";

// ===== Mob Typen =====

var towerTypes = [];

towerTypes[0] = {
    name: "Wall",
    desc: "Helps you maze.",
    level: 0,
    isBlocking: true,
    radius: 0,
    power: 0,
    price: 10,
    sellPrice: 5,
    tex: null,
    init: function () {}
};

towerTypes[1] = {
    name: "Laser Tower",
    desc: "Standard Laser Tower",
    level: 0,
    isBlocking: true,
    radius: 2,
    price: 15,
    sellPrice: 50,
    tex: null,
    shotTex: null,
    power: 5,
    freq: 7,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.type.freq;
        this.aimFunc = aimFuncs.first;

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
        update: function () {
            var y = this.shotSpr.scale.y;
            y -= 0.1;
            if (y < 0) {
                y = 0;
                this.spr.texture = this.type.tex;
            }
            this.shotSpr.scale.y = y;
        },
        beforeCollide: function () {
            this.reload--;
            this.focus = null;
            this.dist = 0;
        },
        collide: function (mob, dist) {
            if (this.reload > 0) return;

            if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
                this.focus = mob;
                this.dist = dist;
            }
        },
        afterCollide: function () {
            if (this.reload <= 0) {
                this.reload = this.type.freq;
            }
            if (this.focus !== null) {
                this.focus.hit(this.type.power, this);
                this.spr.texture = this.type.tex2;
                this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
                this.shotSpr.scale.x = this.dist;
                this.shotSpr.scale.y = 1;
            }
        }
    }

};

towerTypes[2] = {
    name: "Sharpshooter",
    desc: "Slow Long Range Attack",
    level: 1,
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
        this.aimFunc = aimFuncs.first;

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
        update: function () {
            var y = this.shotSpr.scale.y;
            y -= 0.03;
            if (y < 0) y = 0;
            this.shotSpr.scale.y = y;
        },
        beforeCollide: function () {
            this.reload--;
            this.focus = null;
            this.dist = 0;
        },
        collide: function (mob, dist) {
            if (this.reload > 0) return;

            if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
                this.focus = mob;
                this.dist = dist;
            }
        },
        afterCollide: function () {
            if (this.reload <= 0) {
                this.reload = this.type.freq;
            }
            if (this.focus !== null) {
                this.focus.hit(this.type.power, this);
                this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
                this.shotSpr.scale.x = this.dist;
                this.shotSpr.scale.y = 1;
            }
        }
    }
};

towerTypes[3] = {
    name: "Slime",
    desc: "Can be placed on creep path. Will damage on contact.",
    level: 0,
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
    level: 0,
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

        this.shotSpr = new PIXI.Sprite(this.type.shotTex);
        this.shotSpr.anchor.set(0.5);
        this.shotSpr.x = this.x + game.cellCenter;
        this.shotSpr.y = this.y + game.cellCenter;
        this.shotSpr.scale.set(0.1);

        game.shockCon.addChild(this.shotSpr);
    },
    extend: {
        destroy: function () {
            Tower.prototype.destroy.call(this);
            game.shockCon.removeChild(this.shotSpr);
            this.shotSpr.destroy();
        },
        update: function () {
            if (this.shooting) {
                this.shotSpr.scale.x += 0.05;
                this.shotSpr.scale.y += 0.05;
                if (this.shotSpr.scale.x > 1) {
                    this.shotSpr.scale.set(0);
                    this.shooting = false;
                    this.spr.texture = this.type.tex;
                }
            }
        },
        beforeCollide: function () {
            this.reload--;
        },
        collide: function (mob, dist) {
            if (this.reload > 0) return;

            if (this.isInRadius(dist)) {
                this.shooting = true;
                this.spr.texture = this.type.tex2;
                mob.hit(this.type.power, this);
            }
        },
        afterCollide: function () {
            if (this.reload <= 0) {
                this.reload = this.type.freq;
            }
        }
    }
};

towerTypes[5] = {
    name: "Ufo",
    desc: "",
    level: 0,
    isBlocking: true,
    radius: 5,
    price: 500,
    sellPrice: 300,
    tex: null,
    shotTex: null,
    power: 2,
    freq: 15,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.texCounter = 0;
        this.reload = this.type.freq;
        this.aimFunc = aimFuncs.first;

        this.shotSpr = new PIXI.Sprite(this.type.shotTex[0]);
        this.shotSpr.anchor.set(0, 0.5);
        this.shotSpr.x = this.x + game.cellCenter;
        this.shotSpr.y = this.y + game.cellCenter;
        this.shotSpr.scale.set(0);
        game.shotCon.addChild(this.shotSpr);
    },
    extend: {
        destroy: function () {
            Tower.prototype.destroy.call(this);
            game.shotCon.removeChild(this.shotSpr);
            this.shotSpr.destroy();
        },
        update: function () {
            var y = this.shotSpr.scale.y;
            y -= 0.02;
            if (y < 0) y = 0;
            this.shotSpr.scale.y = y;
        },
        beforeCollide: function () {
            this.reload--;
            this.focus = null;
            this.dist = 0;
        },
        collide: function (mob, dist) {
            if (this.reload > 0) return;

            if (this.isInRadius(dist) && this.aimFunc(mob, dist)) {
                this.focus = mob;
                this.dist = dist;
            }
        },
        afterCollide: function () {
            if (this.reload <= 0) {
                this.reload = this.type.freq;
            }
            if (this.focus !== null) {
                this.focus.hit(this.type.power, this);
                this.spr.rotation = this.shotSpr.rotation = this.angleToMob(this.focus);
                this.shotSpr.width = this.dist;
                this.shotSpr.scale.y = 1;
                this.texCounter = (this.texCounter + 1) % 3;
                this.shotSpr.texture = this.type.shotTex[this.texCounter];
            }
        }
    }
};

towerTypes[6] = {
    name: "Aura Tower",
    desc: "Boosts stats of surrounding towers",
    level: 0,
    isBlocking: true,
    radius: 5,
    price: 500,
    sellPrice: 300,
    tex: null,
    shotTex: null,
    power: 0,
    freq: 15,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.texCounter = 0;
        this.animUp = true;
        this.animCounter = 0;
    },
    extend: {
        destroy: function () {
            Tower.prototype.destroy.call(this);
        },
        update: function () {
            if(this.animCounter ===5){
                this.animCounter = 0;

                if(this.animUp){
                    this.texCounter++;
                    if(this.texCounter >3)
                        this.animUp = false;
                }
                else{
                    this.texCounter--;
                    if(this.texCounter < 1)
                        this.animUp = true;
                }
                this.spr.texture = this.type.texAnim[this.texCounter]; 
            }
            else{
                this.animCounter++;
            }
        },
        beforeCollide: function () {
        },
        collide: function (mob, dist) {
        },
        afterCollide: function () {
        }
    }
};

towerTypes[1].next = towerTypes[2];