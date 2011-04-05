// canvas dimensions and colors
var canvW, canvH, padTop, padLeft, COLORS;
var windW = window.innerWidth;
var windH = window.innerHeight;

// relevant objects
var pen, socket, sessionId, curplayer;
var canv = document.getElementById('main');
var cont = canv.getContext('2d');
var coords = {};
var players = {};
var explosions = [];
var running = false;
var winner = false;

// open the socket, and respond to messages (we should recieve an initial one to set the game up)
socket = new io.Socket(null, { port: 8000 }); 
socket.connect();
socket.on('message', function(msg) { updateGrid(msg); });

function updateGrid(data)
{
    // we basically recieve JSON packages, update local variables, then redraw the canvas
    if ('init' in data) { initializeGrid(data); }
    if ('sessionId' in data) { sessionId = data.sessionId; }
    if ('coords' in data) { coords = data.coords; }
    if ('players' in data) { 
        players = data.players;
        curplayer = players[sessionId];
    }
    if ('winner' in data) { announceWinner(data); }
    if ('explosions' in data) { explosions = data.explosions; }
    if ('numUsers' in data) { updateUserList(data); }
    if ('run' in data) {
        $("#title").fadeOut('fast'); 
        running = true;
    }
    if (running && !winner) { drawGame(); }
}

function updateUserList(data)
{
    $('#numUsers').html(data.numUsers + " " + (data.numUsers > 1 ? "users" : "user") + " ");
    $('#userList').html('');
    for (var i in players) {
        $('#userList').append("<li>Player #" + i.substr(0, 5) + " is " + (players[i].ready ? "<span class=\"hi\">ready!</span>" : "not ready") + "</li>");
    }
}

function initializeGrid(data)
{
    // first time we contact the server we capture some crucial, game setting values
    // to initialize other objects and align the canvas properly
    COLORS = data.init.COLORS;
    canvW = data.init.canvW;
    canvH = data.init.canvH;
    padTop = (windH - canvH) / 2;
    padLeft = (windW - canvW) / 2;
    pen = new Pen(cont, canvW, canvH); 
 
    $('#main').css({ top: padTop, left: padLeft });
    $('#title').css({ top: padTop + 100, left: padLeft,  width: canvW });
    canv.height = canvH;
    canv.width = canvW;
    pen.clear(COLORS.bg);
}

function announceWinner(data)
{
    winner = data.winner;
    $("#title").html("<h1>" + (winner.lightType === 1 ? "Blue" : "Red") + " Team Wins!</h1>").fadeIn();
}

function drawGame()
{ 
    pen.clear(COLORS.bg);

    // draw red and blue players
    var i, curcoord;
    for (i=0; i < coords.light.length; i++) {
        curcoord = coords.light[i];
        pen.rect(curcoord.x, curcoord.y, coords.tileSize, coords.tileSize, curcoord.color);
    }

    // draw explosions
    for (i=0; i < explosions.length; i++) {
        curexp = explosions[i];
        for (var j=0; j < curexp.particles.length; j++) {
            curpar = curexp.particles[j];
            pen.rect(curpar.x, curpar.y, 3, 3, curexp.color);
        }
    } 

    // draw marker to identify player
    pen.rect(curplayer.curpos.x * coords.tileSize, curplayer.curpos.y * coords.tileSize, coords.tileSize, coords.tileSize, "yellow");
}

$(document).keydown(function(e) 
{ 
    // tell the server user 'id' has changed directions
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        socket.send({'id': sessionId, 'keyCode': e.keyCode});
    }
});

$(".ready").toggle(function() {
    $(this).addClass("active").html("Ready!");
    socket.send({ 'id': sessionId, 'ready': true });
}, function() {
    $(this).removeClass("active").html("Ready?");
    socket.send({ 'id': sessionId, 'ready': false });
});
