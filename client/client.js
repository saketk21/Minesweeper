const io = require( 'socket.io-client' );
const Constants = require( '../lib/Constants.js' )
const $ = require( 'jquery' );
let socket = io.connect( "localhost:5000", {
	path: '/play'
} );

var gameTime = 0,
	lastFrameTime = 0;
var currentSecond = 0,
	frameCount = 0,
	framesLastSecond = 0;
var finalTime = 0;

//stores x-y coordinates and click status of mouse
var mouseState = {
	x: 0,
	y: 0,
	click: null
};

//sets the game's attributes as per the difficulty level and also the live state of the game
var gameState = {
	difficulty: 'easy',
	screen: 'menu',
	newBest: false,
	timeTaken: 0,

	tileW: 25,
	tileH: 25
};

function startGame( difficulty ) {
	socket.emit( Constants.SOCKET_NEW_GAME, {
		playerName: 'saketk21',
		difficulty: difficulty
	} )
};

$( "#beginner" ).click( function () {
	startGame( 'beginner' );
} );

$( "#intermediate" ).click( function () {
	startGame( 'intermediate' );
} );

$( "#expert" ).click( function () {
	startGame( 'expert' );
} );

// updateGame handles the mouse clicks on the board made by the player
function updateGame() {
	if ( gameState.screen == 'menu' ) {
		if ( mouseState.click != null ) {
			startGame( difficulty );

			for ( var i in difficulties ) {
				if ( mouseState.y >= difficulties[ i ].menuBox[ 0 ] &&
					mouseState.y <= difficulties[ i ].menuBox[ 1 ] ) {
					startLevel( i );
					if ( confirm( "Do you want the AI to solve it?" ) ) {
						aiFlag = true;
						mouseState.click = null;
						gameState.screen = "AIplaying";
						return;
					}
					break;
				}
			}
			mouseState.click = null;
		}
	} else if ( gameState.screen == 'won' || gameState.screen == 'lost' ) {
		if ( mouseState.click != null ) {
			socket.on( Constants.SOCKET_WIN_STATE, ( data ) => {
				console.log( "Board State:-\n" + parse( data.newBoardConfig ) );
				console.log( "Game State:-", data.gameState );
			} );

			socket.on( Constants.SOCKET_LOSE_STATE, ( data ) => {
				console.log( "Board State:-\n" + parse( data.newBoardConfig ) );
				console.log( "Game State:-", data.gameState );
			} );
			gameState.screen = 'menu';
			mouseState.click = null;
		}
	} else {
		if ( mouseState.click != null ) {
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

			document.aiHint = () => {
				socket.emit( Constants.SOCKET_AI_ACTION, {} )
			};

			socket.on( 'solutionRecd', data => {
				console.log( "Solution\n" + parse( data.solution ) + "\n3BV:-", data.value3BV );
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

			var cDiff = difficulties[ gameState.difficulty ];

			if ( mouseState.click[ 0 ] >= offsetX &&
				mouseState.click[ 1 ] >= offsetY &&
				mouseState.click[ 0 ] < ( offsetX + ( cDiff.width * gameState.tileW ) ) &&
				mouseState.click[ 1 ] < ( offsetY + ( cDiff.height * gameState.tileH ) ) ) {
				var tile = [
					Math.floor( ( mouseState.click[ 0 ] - offsetX ) / gameState.tileW ),
					Math.floor( ( mouseState.click[ 1 ] - offsetY ) / gameState.tileH )
				];

				if ( mouseState.click[ 2 ] == 1 ) {
					grid[ ( ( tile[ 1 ] * cDiff.width ) + tile[ 0 ] ) ].click();
				} else {
					grid[ ( ( tile[ 1 ] * cDiff.width ) + tile[ 0 ] ) ].flag();
				}
			} else if ( mouseState.click[ 1 ] >= 380 ) {
				gameState.screen = 'menu';
			}

			mouseState.click = null;
		}
	}
}

//method called repeatedly, in order to display the Board's UI
window.onload = function () {
	ctx = document.getElementById( 'game' ).getContext( '2d' );

	// Event listeners
	document.getElementById( 'game' ).addEventListener( 'click', function ( e ) {
		var pos = realPos( e.pageX, e.pageY );
		mouseState.click = [ pos[ 0 ], pos[ 1 ], 1 ];
	} );
	document.getElementById( 'game' ).addEventListener( 'mousemove',
		function ( e ) {
			var pos = realPos( e.pageX, e.pageY );
			mouseState.x = pos[ 0 ];
			mouseState.y = pos[ 1 ];
		} );

	document.getElementById( 'game' ).addEventListener( 'contextmenu',
		function ( e ) {
			e.preventDefault();
			var pos = realPos( e.pageX, e.pageY );
			mouseState.click = [ pos[ 0 ], pos[ 1 ], 2 ];
			return false;
		} );

	requestAnimationFrame( drawGame );
};

//method that updates UI when the game's state is 'menu'
function drawMenu() {
	ctx.textAlign = 'center';
	ctx.font = "bold 26pt sans-serif";
	ctx.fillStyle = "#000000";

	var y = 180;

	for ( var d in difficulties ) {
		var mouseOver = ( mouseState.y >= ( y - 30 ) && mouseState.y <= ( y + 10 ) );

		if ( mouseOver ) {
			ctx.fillStyle = "#000099";
		}

		difficulties[ d ].menuBox = [ y - 20, y + 10 ];
		ctx.fillText( difficulties[ d ].name, 400, y );
		y += 80;

		if ( mouseOver ) {
			ctx.fillStyle = "#000000";
		}
	}

	var y = 210;
	ctx.font = "italic 12pt sans-serif";

	for ( var d in difficulties ) {
		if ( difficulties[ d ].bestTime == 0 ) {
			ctx.fillText( "No best time", 400, y );
		} else {
			var t = difficulties[ d ].bestTime;
			var bestTime = "";
			if ( ( t / 1000 ) >= 60 ) {
				bestTime = Math.floor( ( t / 1000 ) / 60 ) + ":";
				t = t % ( 60000 );
			}
			bestTime += Math.floor( t / 1000 ) +
				"." + ( t % 1000 );
			ctx.fillText( "Best time   " + bestTime, 400, y );
		}
		y += 80;
	}
}

//method that updates UI when the game's state is 'playing'
function drawPlaying() {
	var halfW = gameState.tileW / 2;
	var halfH = gameState.tileH / 2;

	var cDiff = difficulties[ gameState.difficulty ];

	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";

	ctx.fillStyle = "#000000";
	ctx.font = "20px Roboto";
	ctx.fillText( cDiff.name, 400, 30 );

	ctx.fillStyle = "#1e4c6b";
	ctx.font = "bold 18px Roboto";
	ctx.fillText( "Return to Menu", 400, 480 );

	if ( gameState.screen != 'lost' ) {
		ctx.textAlign = "left";
		var x = cDiff.mines - flagClickCounter;
		ctx.fillText( "💣: " + x, 225, 50 );

		var whichT = ( gameState.screen == 'won' ?
			gameState.timeTaken : gameTime );
		var t = '';
		if ( ( gameTime / 1000 ) > 60 ) {
			t = Math.floor( ( whichT / 1000 ) / 60 ) + ':';
		}
		var s = Math.floor( ( whichT / 1000 ) % 60 );
		t += ( s > 9 ? s : '0' + s );

		ctx.textAlign = "right";
		ctx.fillText( "⏱️: " + Math.round( ( whichT / 1000 ).toPrecision( 6 ), 2 ) + " s", 560, 50 );
	}

	if ( gameState.screen == 'lost' || gameState.screen == 'won' ) {
		ctx.textAlign = "center";
		ctx.font = "bold 20px sans-serif";



		if ( gameState.screen == 'won' ) {
			document.getElementById( "results" ).innerHTML = "Results";
			if ( aiFlag == false ) document.getElementById( "noOfClicks" ).innerHTML = "Total Clicks: " + totalClickCounter;
			document.getElementById( "3BV" ).innerHTML = "3BV : " + value3BV;
			var efficiency = Math.round( ( value3BV / totalClickCounter ) * 100 );
			if ( aiFlag == false ) document.getElementById( "efficiency" ).innerHTML = "Efficiency: " + efficiency + "&percnt;";
			document.getElementById( "time" ).innerHTML = "Total time taken: " + finalTime + " seconds";
		}

		ctx.fillText(
			( gameState.screen == 'lost' ?
				"Game Over" : "Cleared!" ), 400, offsetY - 15 );
	}

	ctx.strokeStyle = "#999999";
	ctx.strokeRect( offsetX, offsetY,
		( cDiff.width * gameState.tileW ),
		( cDiff.height * gameState.tileH ) );

	ctx.font = "bold 14px monospace";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for ( var i in grid ) {
		var px = offsetX + ( grid[ i ].x * gameState.tileW );
		var py = offsetY + ( grid[ i ].y * gameState.tileH );

		if ( gameState.screen == 'lost' && grid[ i ].hasMine ) {
			ctx.fillStyle = "#ff9191";
			ctx.font = "bold 14px monospace";
			ctx.fillRect( px, py,
				gameState.tileW, gameState.tileH );
			ctx.fillStyle = "#000000";
			ctx.fillText( "💣", px + halfW, py + halfH );
		} else if ( grid[ i ].currentState == 'visible' ) {
			ctx.fillStyle = "#dddddd";

			if ( grid[ i ].danger ) {
				ctx.fillStyle = "#000000";
				ctx.fillText( grid[ i ].danger, px + halfW, py + halfH );
			}
		} else {
			ctx.fillStyle = "#cccccc";
			ctx.fillRect( px, py,
				gameState.tileW, gameState.tileH );
			ctx.strokeRect( px, py,
				gameState.tileW, gameState.tileH );

			if ( grid[ i ].currentState == 'flagged' ) {
				ctx.fillStyle = "#0000cc";
				ctx.fillText( "🚩", px + halfW, py + halfH );
			}
		}
	}
}

//called repeatedly to display UI
function drawGame() {
	if ( ctx == null ) {
		return;
	}
	if ( gameState.screen == 'menu' ) {
		document.getElementById( "results" ).innerHTML = "";
		document.getElementById( "noOfClicks" ).innerHTML = "";
		document.getElementById( "3BV" ).innerHTML = "";
		// var efficiency = Math.round((value3BV/totalClickCounter)*100);
		document.getElementById( "efficiency" ).innerHTML = "";
		document.getElementById( "time" ).innerHTML = "";
	}
	// Frame & update related timing
	var currentFrameTime = Date.now();
	if ( lastFrameTime == 0 ) {
		lastFrameTime = currentFrameTime;
	}
	var timeElapsed = currentFrameTime - lastFrameTime;
	gameTime += timeElapsed;

	// Update game
	if ( gameState.screen == "AIplaying" )
		aiSolver(); //updateGame();
	else {
		updateGame();
	}
	// Frame counting
	var sec = Math.floor( Date.now() / 1000 );
	if ( sec != currentSecond ) {
		currentSecond = sec;
		framesLastSecond = frameCount;
		frameCount = 1;
	} else {
		frameCount++;
	}

	// Clear canvas
	ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
	ctx.fillRect( 0, 0, 800, 500 );
	ctx.fillStyle = "rgb(240, 20, 20)";
	ctx.strokeRect( 0, 0, 800, 500 );

	if ( gameState.screen == 'menu' ) {
		drawMenu();
	} else {
		drawPlaying();
	}

	// Draw the frame count
	ctx.textAlign = "left";
	ctx.font = "10pt sans-serif";
	ctx.fillStyle = "#000000";
	ctx.fillText( "Framerate: " + framesLastSecond, 20, 20 );

	// Update the lastFrameTime
	lastFrameTime = currentFrameTime;

	// Wait for the next frame...
	requestAnimationFrame( drawGame );
}

//translates the coordinates clicked by the mouse to the x-y coordinates for the Board.
function realPos( x, y ) {
	var p = document.getElementById( 'game' );

	do {
		x -= p.offsetLeft;
		y -= p.offsetTop;

		p = p.offsetParent;
	} while ( p != null );

	return [ x, y ];
}