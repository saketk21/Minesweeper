const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let Board = function ( rows, cols, mineCount ) {
	this.rows = rows;
	this.cols = cols;
	this.mineCount = mineCount;
	this.grid = [];

	this.initGrid = function () {
		this.grid = new Array();
		for ( let row = 0; row < this.cols; row++ ) {
			this.grid.push( new Array() );
		}
		for ( let row = 0; row < this.rows; row++ ) {
			for ( let col = 0; col < this.cols; col++ ) {
				this.grid[ row ].push( new Tile( row, col ) );
			}
		}
		this.placeMines();
		this.calcDanger();
	};

	this.placeMines = function () {
		let mineX = null,
			mineY = null;
		for ( var remMines = mineCount; remMines > 0; remMines-- ) {
			do {
				mineX = Math.floor( Math.random() * this.rows );
				mineY = Math.floor( Math.random() * this.cols );
			} while ( this.grid[ mineX ][ mineY ].hasMine );
			this.grid[ mineX ][ mineY ].placeMine();
		}
	};

	this.calcDanger = function () {
		for ( var row = 0; row < this.rows; row++ ) {
			for ( var col = 0; col < this.cols; col++ ) {
				for ( var dr = row - 1; dr <= row + 1; dr++ ) {
					for ( var dc = col - 1; dc <= col + 1; dc++ ) {
						if ( dr == row && dc == col )
							continue;
						if ( dr < 0 || dr >= this.rows || dc < 0 || dc >= this.cols )
							continue;
						if ( this.grid[ dr ][ dc ].hasMine )
							this.grid[ row ][ col ].danger += 1;
					}
				}
			}
		}
	};

	this.toString = function () {
		let stringrepr = '';
		for ( var row = 0; row < this.cols; row++ ) {
			for ( var col = 0; col < this.rows; col++ ) {
				let currentTile = this.grid[ row ][ col ];
				if ( currentTile.hidden ) {
					if ( currentTile.isFlagged )
						stringrepr += 'F';
					else
						stringrepr += 'H';
				} else if ( currentTile.danger >= 0 ) {
					stringrepr += '' + currentTile.danger;
				}
			}
			stringrepr += '/';
		}
		return stringrepr;
	};

	this.solution = function () {
		let stringrepr = '';
		for ( var row = 0; row < this.cols; row++ ) {
			for ( var col = 0; col < this.rows; col++ ) {
				let currentTile = this.grid[ row ][ col ];
				if ( currentTile.hasMine )
					stringrepr += 'X';
				else
					stringrepr += '' + currentTile.danger;
			}
			stringrepr += '/';
		}
		return stringrepr;
	}

	this.coords = function () {
		let stringrepr = '';
		for ( var row = 0; row < this.cols; row++ ) {
			for ( var col = 0; col < this.rows; col++ ) {
				let currentTile = this.grid[ row ][ col ];
				stringrepr += "(" + currentTile.row + ", " + currentTile.col + ")";
			}
			stringrepr += '/';
		}
		return stringrepr;
	}
}

module.exports = Board;