"use strict";

var towerTypes = [];

towerTypes[0] = {
    name: "Wall",
    desc: "Helps you maze.",
    level: 0,
    isBlocking: true,
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
    freq: 7,
    power: 5,
    price: 15,
    sellPrice: 50,
    tex: null,
    shotTex: null,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.getFreq();
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
                this.reload = this.getFreq();
            }
            if (this.focus !== null) {
                this.focus.hit(this.getPower(), this);
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
    freq: 50,
    power: 50,
    price: 500,
    sellPrice: 300,
    tex: null,
    shotTex: null,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.getFreq();
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
                this.reload = this.getFreq();
            }
            if (this.focus !== null) {
                this.focus.hit(this.getPower(), this);
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
    power: 10,
    price: 100,
    sellPrice: 10,
    tex: null,
    init: function () {},
    extend: {
        collide: function (mob, dist) {
            mob.hit(this.getPower(), this);
        }
    }
};

towerTypes[4] = {
    name: "AoE Tower",
    desc: "Damages all Creeps in the Radius",
    level: 0,
    isBlocking: true,
    radius: 1.5,
    freq: 20,
    power: 100,
    price: 100,
    sellPrice: 10,
    tex: null,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.reload = this.getFreq();
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
                mob.hit(this.getPower(), this);
            }
        },
        afterCollide: function () {
            if (this.reload <= 0) {
                this.reload = this.getFreq();
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
    freq: 15,
    power: 2,
    price: 500,
    sellPrice: 300,
    tex: null,
    shotTex: null,
    init: function () {
        this.focus = null;
        this.dist = 0;
        this.texCounter = 0;
        this.reload = this.getFreq();
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
                this.reload = this.getFreq();
            }
            if (this.focus !== null) {
                this.focus.hit(this.getPower(), this);
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
    radius: 1.5,
    price: 500,
    sellPrice: 300,
    tex: null,
    shotTex: null,
    powerAdd: 0.1,
    freqAdd: 0.1,
    radiusAdd: 0.1,
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
            if ((this.animCounter = (this.animCounter + 1) % 15) === 0) {
                this.animCounter = 0;

                if (this.animUp) {
                    this.texCounter++;
                    if (this.texCounter > 3)
                        this.animUp = false;
                } else {
                    this.texCounter--;
                    if (this.texCounter < 1)
                        this.animUp = true;
                }
                this.spr.texture = this.type.texAnim[this.texCounter];
            }
        }
    }
};

towerTypes[1].next = towerTypes[2];