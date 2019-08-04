const io = require( 'socket.io-client' );
const Constants = require( './../lib/Constants.js' )
const $ = require( 'jquery' );
let socket = io.connect( "localhost:5000", {
	path: '/play'
} );

function startGame( difficulty ) {
	socket.emit( Constants.SOCKET_NEW_GAME, {
		playerName: 'saketk21',
		difficulty: difficulty
	} )
}

$( "#beginner" ).click( function () {
	startGame( 'beginner' );
} );

$( "#intermediate" ).click( function () {
	startGame( 'intermediate' );
} );

$( "#expert" ).click( function () {
	startGame( 'expert' );
} );

function startClick( row, col ) {
	socket.emit( Constants.SOCKET_CLICK_ACTION, {
		row: row,
		col: col
	} )
}

document.startClick = startClick;

document.startFlag = ( row, col ) => {
	socket.emit( Constants.SOCKET_FLAG_ACTION, {
		row: row,
		col: col
	} )
};

document.getSolution = () => {
	socket.emit( 'solution', {} );
};
socket.on( 'solutionRecd', data => {
	console.log( "Solution\n" + parse( data.solution ) );
} )
socket.on( 'connect', () => {
	console.log( "Connected as ", socket.id );
} )

socket.on( Constants.SOCKET_CURRENT_STATE, ( data ) => {
	console.log( "Board State:-\n" + parse( data.newBoardConfig ) );
	console.log( "Game State:-", data.gameState );
} );

socket.on( Constants.SOCKET_LOSE_STATE, ( data ) => {
	console.log( "Board State:-\n" + parse( data.newBoardConfig ) );
	console.log( "Game State:-", data.gameState );
} );

function parse( newBoardConfig ) {
	board = newBoardConfig.split( "/" );
	for ( var i = 0; i < board.length; i++ ) {
		board[ i ] = board[ i ].split( '' ).join( " " );
	}
	return board.join( "\n" );
}