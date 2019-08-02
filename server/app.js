const PORT = process.env.PORT || 5000
const FRAME_RATE = 1000 / 60

// Dependencies
const express = require( 'express' )
const http = require( 'http' )
const morgan = require( 'morgan' )
const path = require( 'path' )
const socketIO = require( 'socket.io' )
const Constants = require( './../lib/Constants.js' )
const Game = require( './src/Game.js' )
const gameStates = require( './src/GameStates.js' )
const AI = require( './src/AI.js' );

// Initialization
const app = express()
const server = http.Server( app )
const io = socketIO( server )
// const gameRoom = new GameRoom()
let socketToGameMap = new Map()
let socketToAIMap = new Map()


app.set( 'port', PORT )

app.use( morgan( 'dev' ) )
app.use( '/client', express.static( path.join( __dirname, '/client' ) ) )
app.use( '/dist', express.static( path.join( __dirname, '/dist' ) ) )

// Routing
app.get( '/', ( request, response ) => {
	response.sendFile( path.join( __dirname, 'src/views/index.html' ) )
} )

app.get( '/leaderboard', ( request, response ) => {
	response.sendFile( path.join( __dirname, 'src/views/leaderboard.html' ) )
} )

/**
 * Server side input handler, modifies the state of the players and the
 * gameRoom based on the input it receives.
 */
io.on( 'connection', socket => {
	socket.on( Constants.SOCKET_NEW_GAME, data => {
		// Create Game object for the new game
		let newGame = new Game();
		let ai = new AI();
		newGame.init();
		ai.init( newGame );
		socketToGameMap.set( socket.id, newGame );
		socketToAIMap.set( socket.id, ai );

	} )

	// socket.on( Constants.SOCKET_JOIN_GAME, data => {
	// 	let gameRoomToJoin = gameRoomNameToGameRoomMap.get( data.gameRoomName );
	// 	if ( gameRoomToJoin.passphrase === data.passphrase ) {
	// 		// Create 
	// 		gameRoomToJoin.addNewPlayer( socket, data.playerName )
	// 	} else {
	// 		socket.emit( Constants.SOCKET_WRONG_PASSPHRASE, "Wrong passphrase for the room" );
	// 	}
	// } )

	// socket.on( Constants.SOCKET_START_GAME, data => {
	// 	let gameRoomToStart = socketToGameRoomMap.get( socket );
	// 	if ( gameRoomToStart.creator === socket ) {
	// 		gameRoomToStart.startGame();
	// 	} else {
	// 		socket.emit( Constants.SOCKET_NOT_CREATOR, "You are not the creator of the room" );
	// 	}
	// } )


	socket.on( Constants.SOCKET_CLICK_ACTION, data => {
		let gameOfThisSocket = socketToGameMap.get( socket.id );
		let newBoardConfig = gameOfThisSocket.handleClick( data.x, data.y );
		let gameState = gameOfThisSocket.getGameState();
		// Emit appropriate event based on gameState
		socket.emit( Constants.SOCKET_CURRENT_STATE, {
			'newBoardConfig': newBoardConfig,
			'gameState': gameState
		} );
	} )

	socket.on( Constants.SOCKET_FLAG_ACTION, data => {
		let gameOfThisSocket = socketToGameMap.get( socket.id );
		let newBoardConfig = gameOfThisSocket.handleFlag( data.x, data.y );
		let gameState = gameOfThisSocket.getGameState();
		socket.emit( Constants.SOCKET_CURRENT_STATE, {
			'newBoardConfig': newBoardConfig,
			'gameState': gameState
		} );
	} )

	socket.on( Constants.SOCKET_AI_ACTION, data => {
		let aiOfThisSocket = socketToAIMap.get( socket.id );
		let newBoardConfig = aiOfThisSocket.aiSolve();
		let gameState = gameOfThisSocket.getGameState();
		socket.emit( Constants.SOCKET_CURRENT_STATE, {
			'newBoardConfig': newBoardConfig,
			'gameState': gameState
		} );
	} )

	socket.on( Constants.SOCKET_DISCONNECT, () => {} )
} )

// Starts the server.
server.listen( PORT, () => {
	// eslint-disable-next-line no-console
	console.log( `Starting server on port ${PORT}` )
} )