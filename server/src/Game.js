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
		this.gameState = gameStates.IN_PROGRESS;
		this.board.initGrid();
	};

	this.hasWon = function() {
		for ( var x = 0; x < this.board.width; x++ ) {
			for ( var y = 0; y < this.board.height; y++ ) {
				if(this.board.grid[x][y].hidden && !this.board.grid[x][y].hasMine)
					return;
			}
		}
		this.gameState = gameStates.WIN;
	};

	this.chord = function ( x, y, tileDanger ) {
		let flagsAroundTile = 0;
		for ( var dx = x - 1; dx <= x + 1; dx++ ) {
			for ( var dy = y - 1; dy <= y + 1; dy++ ) {
				if ( dx == x && dy == y )
					continue;
				if ( dx < 0 || dx > this.width || dy < 0 || dy > this.height )
					continue;
				if ( this.board.grid[ dx ][ dy ].isFlagged )
					flagsAroundTile += 1;
			}
		}
		if ( flagsAroundTile === tileDanger ) {
			for ( var dx = x - 1; dx <= x + 1; dx++ ) {
				for ( var dy = y - 1; dy <= y + 1; dy++ ) {
					if ( dx == x && dy == y )
						continue;
					if ( dx < 0 || dx > this.width || dy < 0 || dy > this.height )
						continue;
					if ( this.board.grid[ dx ][ dy ].hidden )
						this.handleClick( dx, dy );
				}
			}
		}
	};

	this.revealNeighbours = function (x, y) {
		for ( var dx = x - 1; dx <= x + 1; dx++ ) {
			for ( var dy = y - 1; dy <= y + 1; dy++ ) {
				if ( dx == x && dy == y )
					continue;
				if ( dx < 0 || dx > this.width || dy < 0 || dy > this.height )
					continue;
				if ( this.board.grid[ dx ][ dy ].hidden ) {
					let clickStatus = this.revealTile(dx, dy);
					if(clickStatus === 0) {
						this.revealNeighbours(dx, dy);
					}
				}
			}
		}
	};

	this.handleClick = function ( x, y ) {
		// Will return grid's string representation after the click action
		let clickStatus = this.board.grid[ x ][ y ].revealTile();
		if ( clickStatus === tileTypes.MINE_CLICKED ) {
			this.gameState = gameStates.LOSE;
		} else if ( clickStatus === tileTypes.VISIBLE ) {
			// Chording
			this.chord( x, y, clickStatus );
		} else if ( clickStatus == 0 ) {
			this.revealNeighbours( x, y );
		}
		this.hasWon();
		return this.board.toString();
	};

	this.handleFlag = function ( x, y ) {
		this.board.grid[x][y].flagOrUnflagTile();
		return this.board.toString();
	}

	this.handleAutoMove = function () {
		// Will return board config after the AI's action and also handle state change
	}

	this.getGameState = function () {
		return gameState;
	}
}

module.exports = Game;