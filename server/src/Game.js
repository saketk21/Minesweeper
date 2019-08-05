const difficulties = require( './Difficulties.js' );
const gameStates = require( './GameStates.js' );
const tileTypes = require( './TileTypes.js' );
const Board = require( './Board.js' );

let Game = function () {
	this.board = null;
	this.playerName = null;
	this.socket = null;
	this.gameState = gameStates.NOT_STARTED;
	this.startTime = null;
	this.timeTaken = null;

	this.init = function ( playerName, socket, difficulty ) {
		this.playerName = playerName;
		this.socket = socket;
		this.difficulty = difficulty;
		// Create source board based on gameRoom parameters
		let currentDifficulty = difficulties[ this.difficulty ];
		this.board = new Board( currentDifficulty.rows, currentDifficulty.cols, currentDifficulty.mineCount );
		this.gameState = gameStates.IN_PROGRESS;
		this.board.initGrid();
		this.startTime = Date.now();
	};

	this.hasWon = function () {
		for ( var row = 0; row < this.board.rows; row++ ) {
			for ( var col = 0; col < this.board.cols; col++ ) {
				if ( this.board.grid[ row ][ col ].hidden && !this.board.grid[ row ][ col ].hasMine )
					return;
			}
		}
		this.gameState = gameStates.WIN;
		this.timeTaken = Date.now() - this.startTime;
	};

	this.chord = function ( row, col, tileDanger ) {
		let flagsAroundTile = 0;
		console.log( "Chroding:- ", row, col, tileDanger );
		for ( var dr = row - 1; dr <= row + 1; dr++ ) {
			for ( var dc = col - 1; dc <= col + 1; dc++ ) {
				console.log( "DR, DC in chording:-", dr, dc );
				if ( dr == row && dc == col )
					continue;
				if ( dr < 0 || dr >= this.board.rows || dc < 0 || dc >= this.board.cols )
					continue;
				if ( this.board.grid[ dr ][ dc ].isFlagged )
					flagsAroundTile += 1;
			}
		}
		console.log( "flags around (" + row + ", " + col + ") -- ", flagsAroundTile );
		if ( flagsAroundTile === tileDanger ) {
			console.log( "Trying all neighbours:- " )
			for ( var dr = row - 1; dr <= row + 1; dr++ ) {
				for ( var dc = col - 1; dc <= col + 1; dc++ ) {
					if ( dr == row && dc == col )
						continue;
					if ( dr < 0 || dr >= this.board.rows || dc < 0 || dc >= this.board.cols )
						continue;
					if ( this.board.grid[ dr ][ dc ].hidden ) {
						console.log( "Hidden:- ", dr, dc );
						this.handleClick( dr, dc );
					}
				}
			}
		}
	};

	this.revealNeighbours = function ( row, col ) {
		console.log( "Call with:", row, col, this.board.rows, this.board.cols );
		for ( var dr = row - 1; dr <= row + 1; dr++ ) {
			for ( var dc = col - 1; dc <= col + 1; dc++ ) {
				if ( dr === row && dc === col )
					continue;
				if ( dr < 0 || dr >= this.board.rows || dc < 0 || dc >= this.board.cols )
					continue;
				console.log( "\tdr, dc: ", dr, dc, this.board.rows, this.board.cols );
				if ( this.board.grid[ dr ][ dc ].hidden ) {
					let clickStatus = this.board.grid[ dr ][ dc ].revealTile();
					if ( clickStatus === 0 ) {
						this.revealNeighbours( dr, dc );
					}
				}
			}
		}
	};

	this.handleClick = function ( row, col ) {
		if ( row >= 0 && col >= 0 && row < this.board.rows && col < this.board.cols ) {
			// Will return grid's string representation after the click action
			console.log( this.board.grid[ row ][ col ] );
			let clickStatus = this.board.grid[ row ][ col ].revealTile();
			console.log( clickStatus );
			if ( clickStatus === tileTypes.MINE_CLICKED ) {
				this.gameState = gameStates.LOSE;
			} else if ( clickStatus === tileTypes.VISIBLE ) {
				// Chording
				this.chord( row, col, this.board.grid[ row ][ col ].danger );
			} else if ( clickStatus === 0 ) {
				this.revealNeighbours( row, col );
			}
			this.hasWon();
		}
		return this.board.toString( this.gameState );
	};

	this.handleFlag = function ( row, col ) {
		this.board.grid[ row ][ col ].flagOrUnflagTile();
		return this.board.toString( this.gameState );
	}

	this.getGameState = function () {
		return this.gameState;
	}

	this.updateStatistics = function () {

	};
}

module.exports = Game;