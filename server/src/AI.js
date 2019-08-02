const difficulties = require( './Difficulties.js' );
const gameStates = require( './GameStates.js' );
const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let AI = function () {

    this.aiTargetX = 0; //global variables
    this.aiTargetY = 0;
    this.flagTarget = false;
    this.game = null;
    this.targetsList = []; //has a list of tiles on which the AI will perform either click or flag action
    this.aiCornerCount = 0;
    this.aiCorners = [ 0, 0, 0, 0 ];

    this.init = function ( game ) { //init called when new AI object is created
        this.game = game;

    };

    this.aiSolve = function () {
        let newBoardConfig = null;
        if ( !flagTarget ) { // Make a move
            if ( this.game.board.grid[ this.aiTargetX ][ this.aiTargetY ].isFlagged == true ) {
                console.log( "Incorrect click attempt." );
            } else {
                newBoardConfig = this.game.handleClick( this.aiTargetX, this.aiTargetY );
            }
        } else {
            if ( this.game.board.grid[ this.aiTargetX ][ this.aiTargetY ].isFlagged == false ) {
                newBoardConfig = this.game.handleFlag( this.aiTargetX, this.aiTargetY );
            }
        }

        // Recompute Tile Info due to newly revealed information
        this.computeTileInfo();

        // Remove any tiles which are present in targetsList if they have been revealed
        // This will save a click
        for ( var i = 0; i < this.targetsList.length; i++ ) {
            if ( this.game.board.grid[ this.targetsList[ i ].x ][ this.targetsList[ i ].y ].hidden == false ) {
                this.targetsList.splice( i );
                i--;
            }
        }

        // Get the next target from the targetsList
        if ( this.targetsList.length !== 0 ) {
            this.aiTargetX = this.targetsList[ 0 ].x;
            this.aiTargetY = this.targetsList[ 0 ].y;
            if ( targetsList[ 0 ].needToFlag ) {
                this.flagTarget = true;
                console.log( "targetList flags" );
            } else {
                this.flagTarget = false;
                console.log( "targetList clicks" );
            }
            this.targetsList.shift();

        } else { // All previously computed targets have been exhausted
            this.findNewTarget();
        }
        return newBoardConfig;
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
    };

    // Use obtained information to determine whether any new targets are generated
    this.findNewTarget = function () {
        // Any tile having equal danger and hidden tiles -> All hidden tiles are mines
        this.aiSameDangerAndHiddenNear(); //DOUBT - Check if need to comment this
        // Any tile having equal danger and flagged tiles -> All hidden tiles are safe
        this.aiSameDangerAndFlaggedNear();
        // If still no new targets revealed - check using linked configurations
        if ( this.targetsList.length === 0 )
            this.aiFindTargetsUsingLinkedInfo();
        // Even if there's still no new targets - All hope lost, random guess
        if ( this.targetsList.length === 0 )
            this.aiClickRandomTile();
    };

    //method used by our AI solver to flag the neighboring hidden tiles if the value displayed on the tile (danger)
    //and the no. of hidden tiles around the tile are same
    this.aiSameDangerAndHiddenNear = function () {
        for ( var x = 0; x < this.game.board.width; x++ ) {
            for ( var y = 0; y < this.game.board.height; y++ ) {
                if ( this.game.board.grid[ x ][ y ].danger == this.game.board.grid[ x ][ y ].hiddenNear && this.game.board.grid[ x ][ y ].danger !== 0 ) {
                    for ( var py = y - 1; py <= y + 1; py++ ) {
                        for ( var px = x - 1; px <= x + 1; px++ ) {
                            if ( px == x && py == y ) {
                                continue;
                            }
                            if ( px < 0 || py < 0 || px >= this.game.board.width || py >= this.game.board.height ) {
                                continue;
                            }
                            if ( this.game.board.grid[ px ][ py ].hidden == true && !this.game.board.grid[ px ][ py ].alreadyTargeted ) {
                                this.targetsList.push( new Target( px, py, true ) );
                                console.log( "aiSameDangerAndHiddenNear flags" );
                                this.game.board.grid[ px ][ py ].alreadyTargeted = true;
                            }
                        }
                    }
                }
            }
        }
    };

    //method used by our AI solver to click on the neighboring hidden tiles if the value displayed on the tile (danger)
    //and the no. of flags around the tile are same
    this.aiSameDangerAndFlaggedNear = function () {
        for ( var x = 0; x < this.game.board.width; x++ ) {
            for ( var y = 0; y < this.game.board.height; y++ ) {
                if ( this.game.board.grid[ x ][ y ].danger == this.game.board.grid[ x ][ y ].flaggedNear ) {
                    for ( var py = y - 1; py <= y + 1; py++ ) {
                        for ( var px = x - 1; px <= x + 1; px++ ) {
                            if ( px == x && py == y ) {
                                continue;
                            }
                            if ( px < 0 || py < 0 || px >= this.game.board.width || py >= this.game.board.height ) {
                                continue;
                            }
                            if ( this.game.board.grid[ px ][ py ].hidden == true && !this.game.board.grid[ px ][ py ].alreadyTargeted ) {
                                this.targetsList.push( new Target( px, py, false ) );
                                console.log( "aiSameDangerAndFlaggedNear clicks" );
                                this.game.board.grid[ px ][ py ].alreadyTargeted = true;
                            }
                        }
                    }
                }
            }
        }
    };

    //method used by our AI solver, to add a list of tiles (that are safe to click at) to the 'targetList'
    //logic for safe tiles is such that mutually excluded set of tiles from the intersection of all the set of tiles
    //in the array of 'linkedWith'
    this.aiFindTargetsUsingLinkedInfo = function () {
        for ( var x = 0; x < this.game.board.width; x++ ) {
            for ( var y = 0; y < this.game.board.height; y++ ) {
                if ( this.game.board.grid[ x ][ y ].hidden == false && this.game.board.grid[ x ][ y ].isFlagged == false ) {
                    if ( this.game.board.grid[ x ][ y ].danger !== 1 && this.game.board.grid[ x ][ y ].danger !== 0 &&
                        this.game.board.grid[ x ][ y ].danger - this.game.board.grid[ x ][ y ].flaggedNear > 1 ) {
                        for ( var k = 0; k < this.game.board.grid[ x ][ y ].allHiddenNeighbours.length; k++ ) {
                            if ( this.game.board.grid[ x ][ y ].allHiddenNeighbours[ k ].isLinked ) {
                                var numberOfLinked = 0;
                                linkedTilesAdjacentToThis = [];
                                for ( var l = 0; l < this.game.board.grid[ x ][ y ].allHiddenNeighbours[ k ].linkedWith.length; l++ ) {
                                    if ( this.game.board.grid[ x ][ y ].allHiddenNeighbours.includes( this.game.board.grid[ x ][ y ].allHiddenNeighbours[ k ].linkedWith[ l ] ) ) {
                                        numberOfLinked += 1;
                                        linkedTilesAdjacentToThis.push( this.game.board.grid[ x ][ y ].allHiddenNeighbours[ k ].linkedWith[ l ] );
                                    }
                                }
                                if ( numberOfLinked > 1 ) {
                                    if ( this.game.board.grid[ x ][ y ].hiddenNear - ( numberOfLinked - 1 ) === this.game.board.grid[ x ][ y ].danger ) {
                                        for ( var m = 0; m < this.game.board.grid[ x ][ y ].allHiddenNeighbours.length; m++ ) {
                                            if ( !linkedTilesAdjacentToThis.includes( this.game.board.grid[ x ][ y ].allHiddenNeighbours[ m ] ) ) {
                                                temp = this.game.board.grid[ x ][ y ].allHiddenNeighbours[ m ];
                                                this.targetsList.push( new Target( temp.x, temp.y, true ) );
                                                console.log( "aiFindTargetsUsingLinkedInfo clicks" );
                                                temp.alreadyTargeted = true;
                                            }
                                        }
                                    }
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    //method used by our AI solver to click on the corners of the Board if it finds no other better action to perform
    this.aiClickRandomTile = function () {
        //add code for probability
        // start by clicking corners
        var cornerId = Math.floor( Math.random() * 4 );
        if ( this.aiCornerCount < 4 ) {
            if ( this.aiCorners[ cornerId ] == 0 ) {
                switch ( cornerId ) {
                    case 0:
                        this.aiTargetX = 0;
                        this.aiTargetY = 0;
                        break;
                    case 1:
                        this.aiTargetX = 0;
                        this.aiTargetY = this.game.board.height - 1;
                        break;
                    case 2:
                        this.aiTargetX = this.game.board.width - 1;
                        this.aiTargetY = 0;
                        break;
                    case 3:
                        this.aiTargetX = this.game.board.width - 1;
                        this.aiTargetY = this.game.board.height - 1;
                        break;
                }
                this.aiCorners[ cornerId ] = 1;
                this.aiCornerCount++;
                this.flagTarget = false;
            }
        } else {
            do {
                aiTargetX = Math.floor( Math.random() * this.game.board.width );
                aiTargetY = Math.floor( Math.random() * this.game.board.height );
            } while ( this.game.board.grid[ aiTargetX ][ aiTargetY ].hidden == false ||
                this.game.board.grid[ aiTargetX ][ aiTargetY ].isFlagged == true || this.game.board.grid[ aiTargetX ][ aiTargetY ].hasMine == true );
            this.flagTarget = false;
        }
    };

    //stores the x-y coordinates and the action to be performed on it
    this.Target( x, y, needToFlag ) = function () { //DOUBT - is this correct?
        this.x = x;
        this.y = y;
        this.needToFlag = needToFlag;
    };

};

module.exports = AI;