"use strict";
/* ===== Path finding ===== */

var PFfinder = new PF.AStarFinder({
    allowDiagonal: false,
    heuristic: PF.Heuristic.manhattan
});


game.findPath = function () {
    return PFfinder.findPath(
            game.map.start.x,
            game.map.start.y,
            game.map.finish.x,
            game.map.finish.y,
            game.PFgrid.clone());
};

game.drawPath = function () {
    game.clearPath();
    var path = game.path;
    var cont = game.pathCont;
    var tex = texFromCache("pathMark");
    var spr = null;
    // Pfad malen
    for (var i = 0; i < path.length; i++) {
        spr = new PIXI.Sprite(tex);
        spr.x = utils.cell2Pos(path[i][0]);
        spr.y = utils.cell2Pos(path[i][1]);
        cont.addChild(spr);
    }
};

game.clearPath = function () {
    // Alte Sprites löschen
    var cont = game.pathCont;
    for (var i = 0; i < cont.children.length; i++) {
        cont.children[i].destroy();
    }
    cont.removeChildren();
};
// Zelle für Pfad und Tower sperren
game.lockCell = function (cx, cy) {
    game.collGrid.lockAt(cx, cy);
    game.PFgrid.setWalkableAt(cx, cy, false);
};