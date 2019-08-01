const difficulties = require( './Difficulties.js' );
const gameStates = require( './GameStates.js' );
const tileTypes = require( './TileTypes.js' );

let Game = function () {
	this.board = null;
	this.socket = null;
	this.gameState = gameStates.NOT_STARTED;

	this.init = function ( socket, difficulty ) {
		this.socket = socket;
		this.difficulty = difficulty;
		// Create source board based on gameRoom parameters
		let currentDifficulty = difficulties[ this.difficulty ];
		this.board = new Board( currentDifficulty.width, currentDifficulty.height, currentDifficulty.mineCount );
		this.board.initGrid();
	};

	this.handleClick = function ( x, y ) {
		// Will return board config after the click action
		let clickStatus = this.board.grid[ x ][ y ].revealTile();
		if ( clickStatus === tileTypes.MINE_CLICKED ) {
			this.gameState = gameStates.LOSE;
		} else if ( clickStatus === tileTypes.VISIBLE ) {
			// Chording
			this.board.chord( x, y );
		} else if ( clickStatus == 0 ) {
			this.board.revealNeighbours( x, y );
		}
	};

	this.handleFlag = function ( x, y ) {
		// Will return board config after the flag action
	}

	this.handleAutoMove = function () {
		// Will return board config after the AI's action and also handle state change
	}

	this.getGameState = function () {
		return gameState;
	}
}

module.exports = Game;