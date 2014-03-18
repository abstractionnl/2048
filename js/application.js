copyGrid = function(grid)
{
    var newGrid = new Grid(grid.size);
    grid.eachCell(function (x, y, tile) {
        if (tile) {
            newGrid.insertTile(new Tile({x: x, y: y}, tile.value));
        }
    });

    return newGrid;
};

findFarthestPosition = function(grid, cell, vector) {
    var previous;

    // Progress towards the vector direction until an obstacle is found
    do {
        previous = cell;
        cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (grid.withinBounds(cell) &&
        grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // Used to check if a merge is required
    };
};

moveGrid = function(grid, vector, traversals)
{
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            var cell = { x: x, y: y };
            var tile = grid.cellContent(cell);

            if (tile) {
                var positions = findFarthestPosition(grid, cell, vector);
                var next      = grid.cellContent(positions.next);

                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    grid.insertTile(merged);
                    grid.removeTile(tile);

                    tile.updatePosition(positions.next);
                } else {
                    grid.removeTile(tile);
                    tile.updatePosition(positions.farthest);
                    grid.insertTile(tile);
                }
            }
        });
    });

    return grid;
};

var cellScores = {2: 0};
for (var i=4; i<=4096; i*=2) {
    cellScores[i] = (cellScores[i/2]*2) + i;
}

function score(grid) {
    var score = 0;

    grid.eachCell(function(x, y, tile) {
        if (tile) {
            score += cellScores[tile.value] * (1+x); // Add x and y to force movement

            // Check adjacent cells if they contain cells with equal values
            var tiles = [grid.cellContent({x:x-1,y:y}), grid.cellContent({x:x+1,y:y}), grid.cellContent({x:x,y:y-1}), grid.cellContent({x:x,y:y+2})];
            if (tiles[0] != null && tiles[0].value == tile.value) score += tile.value;          // Score adjacent tiles
            if (tiles[1] != null && tiles[1].value == tile.value) score += tile.value;          // Score adjacent tiles
            if (tiles[2] != null && tiles[2].value == tile.value) score += tile.value;          // Score adjacent tiles
            if (tiles[3] != null && tiles[3].value == tile.value) score += tile.value;          // Score adjacent tiles
        }
    });

    return score;
}

maxIndex = function(arr) {
    var max = 0;

    for (var i=0; i<arr.length; i++) {
        if (arr[i] > arr[max]) {
            max = i;
        }
    }

    return max;
};

gridEquals = function(gridA, gridB) {
    for (var x = 0; x < gridA.size; x++) {
        for (var y = 0; y < gridA.size; y++) {
            if (gridA.cells[x][y] == null && gridB.cells[x][y] == null) // Both null, continue
                continue;

            if (gridA.cells[x][y] == null || gridB.cells[x][y] == null) // One is null, the other isn't
                return false;

            if (gridA.cells[x][y].value != gridB.cells[x][y].value)
                return false;
        }
    }

    return true;
};

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var gm = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalScoreManager);
    var i = 0;
    setInterval(function() {
        var vectors = [gm.getVector(0), gm.getVector(1), gm.getVector(2), gm.getVector(3)];
        var traversals = [gm.buildTraversals(vectors[0]), gm.buildTraversals(vectors[1]), gm.buildTraversals(vectors[2]), gm.buildTraversals(vectors[3])];
        var grids = [moveGrid(copyGrid(gm.grid), vectors[0], traversals[0]), moveGrid(copyGrid(gm.grid), vectors[1], traversals[1]),
            moveGrid(copyGrid(gm.grid), vectors[2], traversals[2]), moveGrid(copyGrid(gm.grid), vectors[3], traversals[3])];
        var moves = [gridEquals(gm.grid, grids[0]) ? 0 : score(grids[0]),
                gridEquals(gm.grid, grids[1]) ? 0 : score(grids[1]),
                gridEquals(gm.grid, grids[2]) ? 0 : score(grids[2]),
                gridEquals(gm.grid, grids[3]) ? 0 : score(grids[3])];

        console.log(moves);
        gm.move(maxIndex(moves));
    }, 100);
});
