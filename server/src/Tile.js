const tileTypes = require( './TileTypes.js' );

let Tile = function ( row, col ) {
	// Basic members for Tile State
	// These member states are determined by actions on Tile, hence updates will occur via methods of Tile class
	this.row = row;
	this.col = col;
	this.hidden = true;
	this.isFlagged = false;
	this.hasMine = false;

	// Since Tile has no idea about its neighbours, these members will be updated via methods of Board class
	this.danger = 0;
	this.hiddenNear = 0;
	this.flaggedNear = 0;
	this.isLinked = 0;
	this.linkedWith = [];

	//following members are required by AI
	this.allHiddenNeighbours = [];
	this.alreadyTargeted = false;

	this.placeMine = function () {
		this.hasMine = true;
	}
	// Called when left-click on Tile is done
	this.revealTile = function () {
		var returnValue = tileTypes.FLAGGED;
		if ( this.hidden && !this.isFlagged ) {
			// Clicked on tile which has mine, return MINE_CLICKED for game over
			if ( this.hasMine )
				returnValue = tileTypes.MINE_CLICKED;
			// Tile is hidden, not flagged and doesn't have mine, so return danger value
			this.hidden = false;
			returnValue = this.danger;
		} else if ( !this.hidden ) {
			// Clicked on visible tile, return VISIBLE enum value for chording
			returnValue = tileTypes.VISIBLE;
		}
		return returnValue;
	};

	this.flagOrUnflagTile = function () {
		var returnValue = tileTypes.VISIBLE;
		// Only hidden tiles can be flagged or unflagged
		if ( this.hidden ) {
			// If already flagged, unflag
			if ( this.isFlagged ) {
				this.isFlagged = false;
				returnValue = tileTypes.HIDDEN;
			}
			// Flag tile
			else {
				this.isFlagged = true;
				returnValue = tileTypes.FLAGGED;
			}
		}
		return returnValue;
	};
}

module.exports = Tile;