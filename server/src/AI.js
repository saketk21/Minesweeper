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

    this.aiSolve = function () {
        if ( !flagTarget ) { // Make a move
            if ( tempTile.isFlagged == true ) {
                console.log( "Incorrect click attempt." );
            } else {
                this.game.handleClick( this.aiTargetX, this.aiTargetY );
            }
        } else {
            if ( tempTile.isFlagged == false ) {
                this.game.handleFlag( this.aiTargetX, this.aiTargetY );
            }
        }

        // Recompute Tile Info due to newly revealed information
        this.computeTileInfo();

        // Remove any tiles which are present in targetsList if they have been revealed
        // This will save a click
        for ( var i = 0; i < targetsList.length; i++ ) {
            tempTile2 = grid[ targetsList[ i ].y * cDiff.width + targetsList[ i ].x ];
            if ( tempTile2.currentState !== 'hidden' ) {
                targetsList.splice( i );
                i--;
            }
        }

        // Get the next target from the targetsList
        if ( targetsList.length !== 0 ) {
            aiTargetX = targetsList[ 0 ].x;
            aiTargetY = targetsList[ 0 ].y;
            if ( targetsList[ 0 ].needToFlag ) {
                flagTarget = true;
                console.log( "targetList flags" );
            } else {
                flagTarget = false;
                console.log( "targetList clicks" );
            }
            targetsList.shift();

        } else { // All previously computed targets have been exhausted
            findNewTarget();
        }
    };

    //Recomputes various attributes for each tile in the grid after each click or flag
    this.computeTileInfo = function () {
        for ( var x = 0; x < this.game.board.width; x++ ) {
            for ( var y = 0; y < this.game.board.height; y++ ) {
                this.game.board.grid[ x ][ y ].hiddenNear = 0;
                this.game.board.grid[ x ][ y ].flaggedNear = 0;
                this.game.board.grid[ x ][ y ].allHiddenNeighbours = [];
                //if a neighboring tile was flagged or hidden, it will increase the respective counter for that tile and also add that hidden
                //tile to the 'allHiddenNeighbours' array for that tile
                for ( var py = y - 1; py <= y + 1; py++ ) {
                    for ( var px = x - 1; px <= x + 1; px++ ) {
                        if ( px == x && py == y ) {
                            continue;
                        }
                        if ( px < 0 || py < 0 || px >= this.game.board.width || py >= this.game.board.height ) {
                            continue;
                        }
                        if ( this.game.board.grid[ px ][ py ].hidden == true ) {
                            this.game.board.grid[ px ][ py ].hiddenNear += 1;
                            this.game.board.grid[ px ][ py ].allHiddenNeighbours.push( this.game.board.grid[ px ][ py ] );
                        }
                        if ( this.game.board.grid[ px ][ py ].isFlagged == true ) {
                            this.game.board.grid[ px ][ py ].flaggedNear += 1;
                        }
                    }
                }
            }
        }

        //code for adding a list of tiles that satisfy the condition of linkedTiles to that array and also taking care
        //of isLinked attribute for that tile
        for ( var x = 0; x < this.game.board.width; x++ ) {
            for ( var y = 0; y < this.game.board.height; y++ ) {
                if ( this.game.board.grid[ x ][ y ].danger - this.game.board.grid[ x ][ y ].flaggedNear === 1 && this.game.board.grid[ x ][ y ].hiddenNear !== 1 ) {
                    var temp = [];
                    for ( py = y - 1; py <= y + 1; py++ ) {
                        for ( px = x - 1; px <= x + 1; px++ ) {
                            if ( px == x && py == y ) {
                                continue;
                            }
                            if ( px < 0 || py < 0 || px >= this.game.board.width || py >= this.game.board.height )
                                continue;
                            if ( this.game.board.grid[ px ][ py ].hidden == true ) {
                                temp.push( this.game.board.grid[ px ][ py ] );
                            }

                        }
                    }
                    for ( py = y - 1; py <= y + 1; py++ ) {
                        for ( px = x - 1; px <= x + 1; px++ ) {
                            if ( px == x && py == y ) {
                                continue;
                            }
                            if ( px < 0 || py < 0 || px >= this.game.board.width || py >= this.game.board.height )
                                continue;
                            if ( this.game.board.grid[ px ][ py ].hidden == true ) {
                                this.game.board.grid[ px ][ py ].linkedWith = [];
                                for ( var linkedIdx in temp ) {
                                    this.game.board.grid[ px ][ py ].linkedWith.push( temp[ linkedIdx ] );
                                }
                                this.game.board.grid[ px ][ py ].isLinked = true;
                            }
                        }
                    }
                }
            }
        }
    }


};

module.exports = AI;