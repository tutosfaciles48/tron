Player = function Player(client, dir, pos, lightType)
{
    this.id = client.sessionId;
    this.alive = true;
    this.ready = false;

    this.curdir = dir;
    this.prepos = pos;
    this.curpos = pos;
    this.lightType = lightType;

    this.changeDir = function(newdir)
    {
        this.curdir = newdir;
    };

    this.move = function()
    {
        this.prepos = this.curpos;
        if      (this.curdir === DIRECTIONS.N) { this.curpos.y -= 1; }
        else if (this.curdir === DIRECTIONS.E) { this.curpos.x += 1; }
        else if (this.curdir === DIRECTIONS.S) { this.curpos.y += 1; }
        else                                   { this.curpos.x -= 1; }
    };
}

Grid = function Grid(width, height, tileSize)
{
    this.pixelW = width;
    this.pixelH = height;
    this.tileSize = tileSize;
    this.tileW = this.pixelW / this.tileSize;
    this.tileH = this.pixelH / this.tileSize;
    this.grid = new Array(this.tileH);

    // initialize grid elems to '0'
    var i, j;
    for (i=0; i < this.tileH; i++) {
        this.grid[i] = new Array(this.tileW);
        for (j=0; j < this.tileW; j++) {
            this.grid[i][j] = 0;
        }
    }

    this.inBounds = function(x, y)
    {
        return (x < this.tileW && x >= 0) && (y < this.tileH && y >= 0);
    };

    this.getAt =  function(x, y)
    {
        return this.grid[y][x];
    };

    this.setAt = function(x, y, val)
    {
        this.grid[y][x] = val;
    };

    this.map = function(func, kwargs)
    {
        var i, j;
        for (i=0; i < this.tileH; i++) {
            for (j=0; j < this.tileW; j++) {
                kwargs.x = j;
                kwargs.y = i;
                func(this.grid[i][j], kwargs);    
            }
        }
    };
}

Explosion = function Explosion(pos, color)
{
    this.pos = pos;
    this.duration = Math.ceil(Math.random() * 20 + 5);
    this.speed = Math.random() * 10 + 5;
    this.color = color;
    this.particles = [];

    // create initial particles with random direction
    for (var i=0; i < 10; i++) {
        this.particles.push({
            opac: 1,
            x: pos.x,
            y: pos.y,
            dx: (Math.random() * this.speed) - (this.speed / 2),
            dy: (Math.random() * this.speed) - (this.speed / 2),
        });
    }

    this.step = function()
    {
        var i, curpar;
        for (i=0; i < this.particles.length; i++) {
            this.particles[i].opac -= Math.random();
            this.particles[i].x += this.particles[i].dx;
            this.particles[i].y += this.particles[i].dy;
        }
        this.duration -= 1;
    }
    
    this.dead = function()
    {
        return this.duration <= 0;
    }
}

exports.Player = Player;
exports.Grid = Grid;
exports.Explosion = Explosion;
