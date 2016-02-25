"use strict";

var map = {};
map.start = new PIXI.Point(2, 1);
map.finish = new PIXI.Point(6, 15);
map.bgColor = 0xD3D3D3;
map.walls = [[2, 2], [3, 2], [4, 2], [7, 5], [6, 5], [5, 5], [4, 5],
    [2, 8], [3, 8], [4, 8], [4, 9], [4, 10], [4, 1], [3, 5]];
map.locks =
[1,1,1,1,1,1,1,1,1,1,1,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,0,0,0,0,0,0,0,0,0,0,1,
1,1,1,1,1,1,1,1,1,1,1,1];
                
map.groundLayout =
[0,1,1,1,1,1,1,1,1,1,1,2,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
4,5,5,5,5,5,5,5,5,5,5,6,
8,9,9,9,9,9,9,9,9,9,9,10];