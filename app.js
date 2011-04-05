// Module Dependencies
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io');
var models = require('./models.js');

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(express.cookieDecoder());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
  res.render('index');
});

// Web Sockets
DIRECTIONS = { N: 38, E: 39, S: 40, W: 37 };
COLORS = { blue: "#0D9FB6", red: "#F7532E", bg: "#002634" };
CODES = { empty: 0, blue: 1, red: 2 };

var tileSize = 5;
var canvW = 700;
var canvH = 500;
var socket = io.listen(app);
var loop;
var numUsers = 0;
var players = {};
var explosions = [];
var winner = false;
var grid = new models.Grid(canvW, canvH, tileSize);
var spawnPoints = [
    { pos: { x: 0, y: 0 }, dir: DIRECTIONS.S },
    { pos: { x: grid.tileW - 1, y: grid.tileH - 1 }, dir: DIRECTIONS.N },
    { pos: { x: grid.tileW - 1, y: 0 }, dir: DIRECTIONS.S },
    { pos: { x: 0, y: grid.tileH - 1 }, dir: DIRECTIONS.N }
];

socket.on('connection', onConnection);

function onConnection(client)
{
    // add new player's information and send them the current set
    players[client.sessionId] = new models.Player(client, DIRECTIONS.S, { x: 0, y: 0 }, (numUsers % 2) + 1);
    numUsers += 1;
    client.send({ sessionId: client.sessionId, coords: generateCoords(), init: { COLORS: COLORS, canvW: canvW, canvH: canvH }});
    socket.broadcast({ numUsers: numUsers, players: players });

    // add listeners which will handle events from client
    client.on('message', function(msg) { onMessage(msg, client) });
    client.on('disconnect', function() { onDisconnect(client) });
}

function onMessage(msg, client)
{
    if ('id' in msg) {
        if ('keyCode' in msg) { players[msg.id].changeDir(msg.keyCode); }
        if ('ready' in msg) {
            // player sending message will have their ready state toggled
            // if all players are ready, then run the game
            players[msg.id].ready = msg.ready;
            socket.broadcast({ numUsers: numUsers, players: players });
            console.log("Player " + msg.id + " is marked as " + (msg.ready ? "ready" : "not ready"));

            var i, begin = true;
            for (i in players) { if (!players[i].ready) { begin = false; } }
            if (begin) { run(); }
        }
    }
}

function onDisconnect(client)
{
    delete players[client.sessionId];
    numUsers -= 1;
}

function run()
{
    var i, count = 0, curplayer, curspawn;
    for (i in players) {
        curplayer = players[i];
        curspawn = spawnPoints[count];
        curplayer.prepos = curspawn.pos;
        curplayer.curpos = curspawn.pos;
        curplayer.curdir = curspawn.dir;
        count += 1;
    }
    
    socket.broadcast({ 'run': true });
    loop = setInterval(gameLoop, 75); 
    console.log("Game now running...");
}

function gameLoop()
{
    // update players position, check for collisions, spawn explosions when necessary, and then
    // send all the updated information to the client for drawing
    var i, curplayer, aliveCount = 0;
    for (i in players) {
        curplayer = players[i];        

        if (curplayer.alive) {
            grid.setAt(curplayer.prepos.x, curplayer.prepos.y, curplayer.lightType);
            curplayer.move(); 

            if (!grid.inBounds(curplayer.curpos.x, curplayer.curpos.y) || grid.getAt(curplayer.curpos.x, curplayer.curpos.y) > 0) {
                curplayer.alive = false;
                explosions.push(new models.Explosion({ x: curplayer.curpos.x * tileSize, y: curplayer.curpos.y * tileSize }, 
                            (curplayer.lightType === CODES.blue ? COLORS.blue : COLORS.red)));
            } else { 
                aliveCount += 1;
            }
        }
    }

    for (i=0; i < explosions.length; i++) {
        curexp = explosions[i];
        curexp.step(); 
        if (curexp.dead()) { explosions.splice(i, 1); }
    }

    socket.broadcast({ coords: generateCoords(), players: players, explosions: explosions});    

    if (aliveCount === 1) {
        for (i in players) {
            curplayer = players[i];
            if (curplayer.alive) {
                winner = curplayer;
                socket.broadcast({ winner: winner });
                clearInterval(loop);
                return;
            }
        }
    }
}

function generateCoords()
{
    // generates coords that the client will use to draw on their canvas
    var coords = { tileSize: tileSize, light: [] };
    grid.map(convertToCoords, { coords: coords });
    return coords;
}

function convertToCoords(elem, kwargs)
{
    if (elem > 0) {
        kwargs.coords.light.push({
            color: (elem === CODES.blue) ? COLORS.blue : COLORS.red,
            x: kwargs.x * tileSize,
            y: kwargs.y * tileSize
        });        
    }
}

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(8000);
  console.log("Express server listening on port %d", app.address().port)
}






