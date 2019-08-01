const difficulties = require( './Difficulties.js' );
const gameStates = require( './GameStates.js' );
const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let AI = function () {

    this.aiTargetX = 0; //global variables
    this.aiTargetY = 0;
    this.flagTarget = false;
    this.game = null;

    this.init = function ( game ) { //init called when new AI object is created
        this.game = game;

    };

    this.aiSolve = function ( game, board ) {
        var tempTile = board.grid[ aiTargetX ][ aiTargetY ]; // Make a move
        if ( !flagTarget ) {
            if ( tempTile.isFlagged == true ) {
                console.log( "Incorrect click attempt." );
            } else {
                tempTile.click();
            }
        } else {
            if ( tempTile.isFlagged == false ) {
                tempTile.flag();
            }
        }
    };

    // Recompute Tile Info due to newly revealed information
    computeTileInfo();
};

module.exports = AI;