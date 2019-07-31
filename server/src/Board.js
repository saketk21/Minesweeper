const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let Board = function ( width, height, mineCount ) {
	this.width = width;
	this.height = height;
	this.mineCount = mineCount;
	// The creation of grid will be done based on encoding from GameRoom class
	//since in case of Multiplayer, all games need to have same grid structure
	this.grid = [];

}