"use strict";

// Set für schnelles einfügen / löschen
// Verhindet Duplikate, Sortierung wird nicht beachtet
// (Arrays sind leider noch die schnellste Datenstruktur in JavaScript :-/)
var FastSet = function () {
    this.arr = [];
};
FastSet.prototype.add = function (val) {
    if (this.arr.indexOf(val) === -1) {
        this.arr.push(val);
    }
};
FastSet.prototype.remove = function (val) {
    var i = this.arr.indexOf(val);
    if (i === -1) return;
    var last = this.arr.length - 1;
    // Letztes Element mit zu löschendem tauschen
    this.arr[i] = this.arr[last];
    // und weg damit
    this.arr.length--;

};
FastSet.prototype.clear = function () {
    this.arr.length = 0;
};
// Git Array zum iterieren zurück
FastSet.prototype.getArray = function () {
    return this.arr;
};
FastSet.prototype.isEmpty = function () {
    return this.arr.length === 0;
};

// Objekt Pool, um den Garbage Collector zu schonen
// Class ist der Konstruktor

var Pool = function (Class, allocSize) {
    this.pool = [];
    this.Class = Class;
    this.n = allocSize;
};
Pool.prototype.getObj = function () {
    if (this.pool.length === 0) {
        this.alloc();
    }
    return this.pool.pop();
};

Pool.prototype.alloc = function () {
    for (var i = 0; i < this.n; i++) {
        this.pool.push(new this.Class());
    }
};
Pool.prototype.returnObj = function (o) {
    this.pool.push(o);
};
Pool.prototype.clear = function () {
    this.pool = [];
};

// Simple Queue implementierung
// Verwendet offset, um Array operationen zu vermeiden
function Queue() {
    this.queue = [];
    this.offset = 0;
}
Queue.prototype.size = function () {
    return (this.queue.length - this.offset);
};
Queue.prototype.isEmpty = function () {
    return this.size() === 0;
};
Queue.prototype.enqueue = function (item) {
    this.queue.push(item);
};

Queue.prototype.dequeue = function () {
    if (this.isEmpty()) return;
    var item = this.queue[this.offset];
    // Wenn offset doppelt so groß wie Array -> leere Felder löschen
    if (++this.offset * 2 >= this.queue.length) {
        this.queue = this.queue.slice(this.offset);
        this.offset = 0;
    }
    return item;
};

// ===== Hilfs-Funktionen =======
var utils = {};
// Von Pixel zu Zelle
utils.pos2Cell = function (pos) {
    return Math.floor(pos / game.cellSize);
};
// Von x, y Position zu Pixel
utils.cell2Pos = function (cell) {
    return cell * game.cellSize;
};
// Globale Pixel zu Position auf Spielfeld umrechnen
utils.input2Cell = function (px) {
    return utils.pos2Cell(px * game.scale);
};

utils.isStart = function (cx, cy) {
    return cx === game.map.start.x && cy === game.map.start.y;
};
utils.isFinish = function (cx, cy) {
    return cx === game.map.finish.x && cy === game.map.finish.y;
};

utils.dist = function (x, y) {
    return Math.sqrt(x * x + y * y);
};
// Schnelle Math.atan2 Version für Mobs
// x, y können nur 1, 0, -1 sein
utils.fastatan2 = function (y, x) {
    if (y === 0) {
        return x === 1 ? 0 : Math.PI;
    } else {
        return (y === 1 ? 1 : -1) * Math.PI / 2;
    }
};

// Grid für effektive Kollsisionsabfragen
// Einfache implementirung von "Spatial Partitioning"
// Jede Zelle merkt sich, welche Tower sie Treffen könnten
// http://buildnewgames.com/broad-phase-collision-detection/
var CollisionGrid = function (cellsX, cellsY) {
    this.cellsX = cellsX;
    this.cellsY = cellsY;
    // 2D Array - speichert die Position jedes Towers,
    // für Klicks auf das Spielfeld praktisch
    this.towerGrid = [];
    // 3D Array - speichert für jedes Feld alle Tower,
    // deren Radius es treffen könnte
    this.towerCollisions = [];
    // Arrays aufbauen
    var i, j;
    for (i = 0; i < cellsX; i++) {
        this.towerGrid[i] = [];
        this.towerCollisions[i] = [];
        for (j = 0; j < cellsY; j++) {
            this.towerGrid[i][j] = null;
            this.towerCollisions[i][j] = new FastSet();
        }
    }
};

// TODO Es müsste nicht jede Zelle getested werden, nur (x, y) +/-radius
CollisionGrid.prototype.addTower = function (tower) {
    var cx = tower.cx;
    var cy = tower.cy;
    this.towerGrid[cx][cy] = tower;
    var i, j;
    for (i = 0; i < this.cellsX; i++) {
        for (j = 0; j < this.cellsY; j++) {
            // Speichern, wenn Distanz zwischen Feld und Tower < Radius
            // + kleine Abweichung
            if (utils.dist(i - cx, j - cy) <= tower.type.radius + 0.5) {
                this.towerCollisions[i][j].add(tower);
            }
        }
    }
};

CollisionGrid.prototype.deleteTower = function (tower) {
    this.towerGrid[tower.cx][tower.cy] = null;
    var i, j;
    for (i = 0; i < this.cellsX; i++) {
        for (j = 0; j < this.cellsY; j++) {
            this.towerCollisions[i][j].remove(tower);
        }
    }
};

CollisionGrid.prototype.updateTower = function (tower) {
    this.deleteTower(tower);
    this.addTower(tower);
};
// Gibt Kollisions-Set für Zelle x, y zurück
CollisionGrid.prototype.getCollisionsAt = function (cx, cy) {
    return this.towerCollisions[cx][cy];
};
// Gibt Tower in Zelle x, y zurück
CollisionGrid.prototype.getTowerAt = function (cx, cy) {
    return this.towerGrid[cx][cy];
};
// Sperrt Zelle an cx, cy
CollisionGrid.prototype.lockAt = function (cx, cy) {
    this.towerGrid[cx][cy] = false;
};
// Ist Zelle gesperrt?
CollisionGrid.prototype.islockedAt = function (cx, cy) {
    return this.towerGrid[cx][cy] === false;
};

