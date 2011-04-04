Tron: Multiplayer NodeJS Game
=============================

Running:
--------
To run Tron you'll need to install [NodeJS][1], [ExpressJS][2], and Socket.IO[3]. I recommend installing [NPM][4] (Node Packet Manager) after you get NodeJS to make installation of other modules easier.

To run the server, go into the projects top directory and run 'node app.js'. The game should now be available at 'localhost:8000'.

If you want to play with others on a local network, send them to 'your-network-ip:8000'.

How To Play:
------------
The game plays the same as classical Tron (try to get opponents to collide with your light trail, while avoiding theirs), but supports 4-players over a network. Players are split into two teams automatically, and the last color standing wins. 

Your lightcycle will be marked with a yellow square at the head and can be controlled with the arrow keys.

