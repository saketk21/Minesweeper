const gameStates = require( './GameStates.js' );
const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let Board = function ( rows, cols, mineCount ) {
	this.rows = rows;
	this.cols = cols;
	this.mineCount = mineCount;
	this.value3BV = 0;
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
		this.calc3BV();
	};

	this.calc3BV = function(){
		let visited = [];
		let affected = [];
		let depressedAreas = 0;
		let clonedGrid = (function{
			let array = [];
			for(let x = 0; x < rows; x++){
				for(let y = 0; y < columns; y++){
					if(this.grid[x][y].hasMine == true)
						array.push(-1);
					else if(this.grid[x][y].danger == 0)
						array.push(0);
					else
						array.push(1);
					
					visited.push(false);
					affected.push(false);
				}
			}
			return array;
		}());

		for(let index = 0; index < clonedGrid.length; index++){
			if(clonedGrid[index] === 0){
					calcValue(index);
					depressedAreas++;
			}
		}

		let calcValue = (function (idx) {
			if(clonedGrid[idx] === -1)
				return;
		
			if((clonedGrid[idx] === 0 && visited[idx] == false) || (affected[idx] === true)) {
		
				if(clonedGrid[idx] === 0)
					affected[idx] = false;
		
				if(affected[idx] === true){
					clonedGrid[idx] = -1;
					visited[idx] = true;
					return;
				}
				
				for (var py = this.rows - 1; py <= this.rows + 1; py++) {
					for (var px = this.columns - 1; px <= this.columns + 1; px++) {
						if (px == (idx - (idx / this.rows)) && py == (idx / this.columns)) { continue; }
		
						if (px < 0 || py < 0 ||
							px >= this.columns ||
							py >= this.rows) {
							continue;
						}
						clonedGrid[idx] = -1;
						visited[idx] = true;
						var index = py * this.columns + px;
		
						affected[index] = true;
						calcValue(index);
		
					}
		
				}
		
			}
		}());

		let numberCount = 0;
		for(var ind = 0; ind < clonedGrid.length; ind++)
	 	if(clonedGrid[ind] === 1)
					numberCount++;

		this.value3BV = this.depressedAreas + this.numberCount;

	};

	this.get3BV = function(){
		return this.value3BV;
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

	this.toString = function ( gameState ) {
		let stringrepr = '';
		for ( var row = 0; row < this.rows; row++ ) {
			for ( var col = 0; col < this.cols; col++ ) {
				let currentTile = this.grid[ row ][ col ];
				if ( gameState === gameStates.WIN ) {
					if ( currentTile.hasMine )
						stringrepr += 'F';
					else
						stringrepr += currentTile.danger;
				} else if ( gameState === gameStates.LOSE ) {
					if ( currentTile.isFlagged ) {
						if ( currentTile.hasMine )
							stringrepr += 'F';
						else
							stringrepr += 'I';
					} else if ( currentTile.hasMine )
						stringrepr += 'X';
					else if ( currentTile.hidden )
						stringrepr += 'H';
					else
						stringrepr += currentTile.danger;
				} else {
					if ( currentTile.hidden ) {
						if ( currentTile.isFlagged )
							stringrepr += 'F';
						else
							stringrepr += 'H';
					} else if ( currentTile.danger >= 0 ) {
						stringrepr += '' + currentTile.danger;
					}
				}
			}
			stringrepr += '/';
		}
		return stringrepr;
	};

	this.solution = function () {
		let stringrepr = '';
		for ( var row = 0; row < this.rows; row++ ) {
			for ( var col = 0; col < this.cols; col++ ) {
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
		for ( var row = 0; row < this.rows; row++ ) {
			for ( var col = 0; col < this.cols; col++ ) {
				let currentTile = this.grid[ row ][ col ];
				stringrepr += "(" + currentTile.row + ", " + currentTile.col + ")";
			}
			stringrepr += '/';
		}
		return stringrepr;
	}
}

module.exports = Board;