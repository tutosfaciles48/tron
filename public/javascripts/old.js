DIRECTIONS = { N: 38, E: 39, S: 40, W: 37 };
COLORS = {
    light: "#0D9FB6",
    red: "#F7532E",
    bg: "#002634"
};

Tron = new function()
{
    var pen;
    var canv;
    var cont;

    var windW = window.innerWidth;
    var windH = window.innerHeight;
    var canvW = 700;
    var canvH = 500;
    var padTop = (windH - canvH) / 2;
    var padLeft = (windW - canvW) / 2;

    var tileSize = 5;
    var tileW = canvW / tileSize;
    var tileH = canvH / tileSize;
    var grid; 
    var tiles = {
        "empty": 0,
        "light": 1,
        "cycle": 2
    };

    var player; 
    var explosions = [];

    this.build = function()
    {
        ctx = document.getElementById('main');
        canv = ctx.getContext('2d');
        pen = new Pen(canv, canvW, canvH);

        $('#main').css({ top: padTop, left: padLeft });
        ctx.height = canvH;
        ctx.width = canvW;

	    // loop = setInterval(this.run, 100);	
    };

    this.run = function()
    {  
        // handle players
        if (player.alive) {
            grid.setAt(player.prepos.x, player.prepos.y, 1);
            player.move();
        }

        if (player.alive && (!grid.inBounds(player.curpos.x, player.curpos.y) || 
                (grid.getAt(player.curpos.x, player.curpos.y) > 0))) {
            socket.send("Player has Died");
            player.alive = false;
            explosions.push(new Explosion({ x: player.curpos.x * tileSize, y: player.curpos.y * tileSize }));
        } 

        // draw state
        pen.clear(COLORS.bg);
        grid.map(Tron.displayItems, {}); 

        // draw explosions
        for (var i=0; i < explosions.length; i++) {
            curexp = explosions[i];
            curexp.step();
            for (var j=0; j < curexp.particles.length; j++) {
                curpar = curexp.particles[j];
                pen.rect(curpar.x, curpar.y, 3, 3, curexp.color);
            }
            
            if (curexp.dead()) { explosions.splice(i, 1); }
        }
    };

    this.keyboard = $(document).keydown(function(e) 
    {
        if (e.keyCode >= 37 && e.keyCode <= 40) player.changeDir(e.keyCode);        
    });

    this.displayItems = function(elem, kwargs)
    {
        if (elem > 0) { 
            pen.rect(kwargs.x * tileSize, kwargs.y * tileSize, tileSize, tileSize, "#0D9FB6"); 
        }
    };

};

var socket = new io.Socket(null, { port: 8000 }); 
socket.connect();

// socket interaction
handleMsg(msg)
{
    if ('players' in msg) {
        Tron.players = msg.players;
        $('#numUsers').html(msg.players.length); 
        $('#userList').html('');
        for (var i=0; i < msg.players.length; i++) {
            $('#userList').append('<li>' + msg.players[i] + '</li>');
        }
        console.log(Tron.players);
    }
    if ('grid' in msg) { 
        grid = msg.grid;
        console.log(grid);
    }
}

socket.on('message', function (data) { 
    handleMsg(data);
});

socket.on('connect', function() {
    // handle connect of user            
});

socket.on('disconnect', function() {
    // handle disconnect of user
});

/*
function Player(dir, pos)
{
    this.curdir = dir;
    this.prepos = pos;
    this.curpos = pos;
    this.alive = true;
    this.color = COLORS.light;
}
Player.prototype.changeDir = function(newdir)
{
    this.curdir = newdir;
}
Player.prototype.move = function()
{
    this.prepos = this.curpos;
    if      (this.curdir === DIRECTIONS.N) { this.curpos.y -= 1; }
    else if (this.curdir === DIRECTIONS.E) { this.curpos.x += 1; }
    else if (this.curdir === DIRECTIONS.S) { this.curpos.y += 1; }
    else                                   { this.curpos.x -= 1; }
}


function Grid(size)
{
    this.size = size;
    this.grid = new Array(size.height);

    // initialize grid elems to '0'
    var i, j;
    for (i=0; i < this.size.height; i++) {
        this.grid[i] = new Array(this.size.width);
        for (j=0; j < this.size.width; j++) {
            this.grid[i][j] = 0;
        }
    }
}
Grid.prototype.inBounds = function(x, y)
{
    return (x < this.size.width && x >= 0) && (y < this.size.height && y >= 0);
}
Grid.prototype.getAt = function(x, y)
{
    return this.grid[y][x];
}
Grid.prototype.setAt = function(x, y, val)
{
    this.grid[y][x] = val;
}
Grid.prototype.map = function(func, kwargs)
{
    var i, j;
    for (i=0; i < this.size.height; i++) {
        for (j=0; j < this.size.width; j++) {
            kwargs.x = j;
            kwargs.y = i;
            func(this.grid[i][j], kwargs);    
        }
    }
}
*/

function Explosion(pos)
{
    this.pos = pos;
    this.duration = Math.ceil(Math.random() * 20 + 5);
    this.speed = Math.random() * 10;
    this.color = COLORS.light;
    this.particles = [];

    for (var i=0; i < 10; i++) {
        this.particles.push({
            opac: 1,
            x: pos.x,
            y: pos.y,
            dx: (Math.random() * this.speed) - (this.speed / 2),
            dy: (Math.random() * this.speed) - (this.speed / 2),
        });
    }
}
Explosion.prototype.step = function()
{
    var i, curpar;
    for (i=0; i < this.particles.length; i++) {
        this.particles[i].opac -= Math.random();
        this.particles[i].x += this.particles[i].dx;
        this.particles[i].y += this.particles[i].dy;
    }
    this.duration -= 1;
}
Explosion.prototype.dead = function()
{
    return this.duration <= 0;
}

Tron.build();
