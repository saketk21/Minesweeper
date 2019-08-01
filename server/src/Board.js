const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let Board = function ( width, height, mineCount ) {
	this.width = width;
	this.height = height;
	this.mineCount = mineCount;
	this.grid = [];

	this.initGrid = function () {
		this.grid = new Array();
		for ( let y = 0; y < this.height; y++ ) {
			grid.push( new Array() );
		}
		for ( let y = 0; y < this.height; y++ ) {
			for ( let x = 0; x < this.width; x++ ) {
				grid[ y ].push( new Tile( x, y ) );
			}
		}
		this.gameState = gameStates.IN_PROGRESS;
		this.placeMines();
		this.calcDanger();
	};

	this.placeMines = function () {
		let mineX = null,
			mineY = null;
		for ( var remMines = mineCount; remMines > 0; remMines-- ) {
			do {
				mineX = Math.floor( Math.random() * this.width );
				mineY = Math.floor( Math.random() * this.height );
			} while ( grid[ mineX ][ mineY ].hasMine );
			grid[ mineX ][ mineY ].placeMine();
		}
	};

	this.calcDanger = function () {
		for ( var x = 0; x < this.width; x++ ) {
			for ( var y = 0; y < this.height; y++ ) {
				for ( var dx = x - 1; dx <= x + 1; dx++ ) {
					for ( var dy = y - 1; dy <= y + 1; dy++ ) {
						if ( dx == 0 && dy == 0 )
							continue;
						if ( x + dx < 0 || x + dx > this.width || y + dy < 0 || y + dy > this.height )
							continue;
						if ( grid[ x + dx ][ y + dy ].hasMine )
							grid[ x ][ y ].danger += 1;
					}
				}
			}
		}
	};
}

module.exports = Board;