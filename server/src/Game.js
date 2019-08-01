const difficulties = require( './Difficulties.js' );
const gameStates = require( './GameStates.js' );

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
	};

	this.handleFlag = function ( x, y ) {
		// Will return board config after the flag action
	}

	this.getGameState = function () {
		return gameState;
	}
}

module.exports = Game;