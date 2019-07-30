const tileTypes = require( './TileTypes.js' );

let Tile = function ( x, y ) {
	// Basic members for Tile State
	// These member states are determined by actions on Tile, hence updates will occur via methods of Tile class
	this.x = x;
	this.y = y;
	this.hidden = true;
	this.isFlagged = false;
	this.hasMine = false;

	// Since Tile has no idea about its neighbours, these members will be updated via methods of Board class
	this.danger = 0;
	this.hiddenNear = 0;
	this.flaggedNear = 0;
	this.isLinked = 0;
	this.linkedWith = [];

	this.placeMine = function () {
		this.hasMine = true;
	}
	// Called when left-click on Tile is done
	this.revealTile = function () {
		if ( this.hidden && !this.isFlagged ) {
			// Clicked on tile which has mine, return MINE_CLICKED for game over
			if ( this.hasMine )
				return tileTypes.MINE_CLICKED;
			// Tile is hidden, not flagged and doesn't have mine, so return danger value
			this.hidden = false;
			return this.danger;
		} else if ( !this.hidden ) {
			// Clicked on visible tile, return VISIBLE enum value for chording
			return tileTypes.VISIBLE;
		}
		return tileTypes.FLAGGED;
	}

	this.flagOrUnflagTile = function () {
		// Only hidden tiles can be flagged or unflagged
		if ( this.hidden ) {
			// If already flagged, unflag
			if ( this.isFlagged ) {
				this.isFlagged = false;
				return tileTypes.HIDDEN;
			}
			// Flag tile
			else {
				this.isFlagged = true;
				return tileTypes.FLAGGED;
			}
		}
		return tileTypes.VISIBLE;
	}
}

module.exports = Tile;