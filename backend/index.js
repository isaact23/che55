// Absolute BARE minimum for a socket.io server
// const generateID = require('./utils');
// npm install express, socket.io, nodemon(optional)
const app = require('express')();
const http = require('http').createServer(app);
//manage cors requests (NECESSARY since we'll be hosting front and backend separate)
const io = require("socket.io")(http, {
cors: {
    //origin of request
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
}
});

const state = {};
const clientRooms = {};


function generateID(length) {

    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result+=characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// event 'connection' creates a socket
io.on('connection', (socket) => {
    console.log("User connected");
    
    // this is where we can add custom and events (and the data they will send and recieve)
    socket.on('newGame', handleNewGame);
    socket.on('joinGame', handleJoin);
    socket.on('playerMove', hanldleMove);
    socket.on('gameOver', handleGameOver);
    socket.on('playerQuit', handlePlayerQuit);
    socket.on('disconnect', handlePlayerQuit);

    function cleanLobby() {
        //removes client from clientRooms (does not let new player connect)
        delete clientRooms[socket.id];
        console.log(clientRooms);
    }

    function disqualifyPlayer() {

        let room = clientRooms[socket.id];
        let winner; 

        if (!room) {
            return;
        }

        if (socket.number == 1) {
            winner = 2;
        }
        else {
            winner = 1;
        }

        io.sockets.in(room).emit('winner', winner);

        cleanLobby(room);
            
    }

    function handleNewGame() {
        
        //generates new room and joins it
        let room = generateID(5);
        clientRooms[socket.id] = room;
        //lets the frontend see the unique gamecode
        socket.emit('gamecode', room);

        socket.join(room);
        socket.number = 1;
        socket.emit('players', '1');

    }

    //sends the winning player to all players in lobby
    function handleGameOver(winner) {
        
        const room = clientRooms[socket.id];

        if (!room) {
            return;
        }

        io.sockets.in(room).emit('winner', winner);
        console.log(winner);
    }

    function handlePlayerQuit() {
        disqualifyPlayer();
    }

    function handleJoin(roomCode) {
        //looks for the room with the specified roomCode
        const room = Object.fromEntries(io.sockets.adapter.rooms);

        //sets the total number of clients
        let clients = 0;
        if (room && room[roomCode]) {
            clients = room[roomCode].size;
        }

        //if there are no clients the room code is invalid
        if (clients === 0) {
            socket.emit('code', 'unknown invite code');
            console.log('unknown invite code');
            return;
        }
        //if there's more than one the lobby is already full
        else if (clients > 1) {
            socket.emit('code', 'lobby full');
            console.log('lobby full');
            return;
        }

        //sets up joining everything
        clientRooms[socket.id] = roomCode;

        socket.join(roomCode);
        socket.number = 2;
        socket.emit('players', '2');
        socket.emit('gamecode', roomCode);
        io.sockets.in(roomCode).emit('gamePlayable', true);
        console.log('success');
    }

    function hanldleMove(move) {

        //gets he room based on the socket.id
        const room = clientRooms[socket.id];

        if (!room) {
            return;
        }
        //emits that a player has moved and emits to toggle player moves
        io.sockets.in(room).emit('playerMove', move);
        io.sockets.in(room).emit('toggleTurn')
    }
})


//listening on the server
http.listen(4000, () => {
    console.log("Running on port 4000");
})