const difficulties = require( '../../lib/Difficulties.js' );
const gameStates = require( '../../lib/GameStates.js' );
const tileTypes = require( './TileTypes.js' );
let Tile = require( './Tile.js' );

let AI = function () {

    this.aiTargetRow = 0; //global variables
    this.aiTargetCol = 0;
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
        if ( !this.flagTarget ) { // Make a move
            if ( this.game.board.grid[ this.aiTargetRow ][ this.aiTargetCol ].isFlagged == true ) {
                console.log( "Incorrect click attempt." );
            } else {
                newBoardConfig = this.game.handleClick( this.aiTargetRow, this.aiTargetCol );
            }
        } else {
            if ( this.game.board.grid[ this.aiTargetRow ][ this.aiTargetCol ].isFlagged == false ) {
                newBoardConfig = this.game.handleFlag( this.aiTargetRow, this.aiTargetCol );
            }
        }

        // Recompute Tile Info due to newly revealed information
        this.computeTileInfo();

        // Remove any tiles which are present in targetsList if they have been revealed
        // This will save a click
        for ( var i = 0; i < this.targetsList.length; i++ ) {
            if ( this.game.board.grid[ this.targetsList[ i ].row ][ this.targetsList[ i ].col ].hidden == false ) {
                this.targetsList.splice( i );
                i--;
            }
        }

        // Get the next target from the targetsList
        if ( this.targetsList.length !== 0 ) {
            this.aiTargetRow = this.targetsList[ 0 ].row;
            this.aiTargetCol = this.targetsList[ 0 ].col;
            if ( this.targetsList[ 0 ].needToFlag ) {
                this.flagTarget = true;
                console.log( "targetList flags", this.aiTargetRow, this.aiTargetCol );
            } else {
                this.flagTarget = false;
                console.log( "targetList clicks", this.aiTargetRow, this.aiTargetCol );
            }
            this.targetsList.shift();

        } else { // All previously computed targets have been exhausted
            this.findNewTarget();
        }
        return newBoardConfig;
    };

    //Recomputes various attributes for each tile in the grid after each click or flag
    this.computeTileInfo = function () {
        for ( var row = 0; row < this.game.board.rows; row++ ) {
            for ( var col = 0; col < this.game.board.cols; col++ ) {
                this.game.board.grid[ row ][ col ].hiddenNear = 0;
                this.game.board.grid[ row ][ col ].flaggedNear = 0;
                this.game.board.grid[ row ][ col ].allHiddenNeighbours = [];
                //if a neighboring tile was flagged or hidden, it will increase the respective counter for that tile and also add that hidden
                //tile to the 'allHiddenNeighbours' array for that tile
                for ( var dc = col - 1; dc <= col + 1; dc++ ) {
                    for ( var dr = row - 1; dr <= row + 1; dr++ ) {
                        if ( dr == row && dc == col ) {
                            continue;
                        }
                        if ( dr < 0 || dc < 0 || dr >= this.game.board.rows || dc >= this.game.board.cols ) {
                            continue;
                        }
                        if ( this.game.board.grid[ dr ][ dc ].hidden == true ) {
                            this.game.board.grid[ dr ][ dc ].hiddenNear += 1;
                            this.game.board.grid[ dr ][ dc ].allHiddenNeighbours.push( this.game.board.grid[ dr ][ dc ] );
                        }
                        if ( this.game.board.grid[ dr ][ dc ].isFlagged == true ) {
                            this.game.board.grid[ dr ][ dc ].flaggedNear += 1;
                        }
                    }
                }
            }
        }

        //code for adding a list of tiles that satisfy the condition of linkedTiles to that array and also taking care
        //of isLinked attribute for that tile
        for ( var row = 0; row < this.game.board.rows; row++ ) {
            for ( var col = 0; col < this.game.board.cols; col++ ) {
                if ( this.game.board.grid[ row ][ col ].danger - this.game.board.grid[ row ][ col ].flaggedNear === 1 && this.game.board.grid[ row ][ col ].hiddenNear !== 1 ) {
                    var temp = [];
                    for ( dc = col - 1; dc <= col + 1; dc++ ) {
                        for ( dr = row - 1; dr <= row + 1; dr++ ) {
                            if ( dr == row && dc == col ) {
                                continue;
                            }
                            if ( dr < 0 || dc < 0 || dr >= this.game.board.rows || dc >= this.game.board.cols )
                                continue;
                            if ( this.game.board.grid[ dr ][ dc ].hidden == true ) {
                                temp.push( this.game.board.grid[ dr ][ dc ] );
                            }

                        }
                    }
                    for ( dc = col - 1; dc <= col + 1; dc++ ) {
                        for ( dr = row - 1; dr <= row + 1; dr++ ) {
                            if ( dr == row && dc == col ) {
                                continue;
                            }
                            if ( dr < 0 || dc < 0 || dr >= this.game.board.rows || dc >= this.game.board.cols )
                                continue;
                            if ( this.game.board.grid[ dr ][ dc ].hidden == true ) {
                                this.game.board.grid[ dr ][ dc ].linkedWith = [];
                                for ( var linkedIdx in temp ) {
                                    this.game.board.grid[ dr ][ dc ].linkedWith.push( temp[ linkedIdx ] );
                                }
                                this.game.board.grid[ dr ][ dc ].isLinked = true;
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
        //this.aiSameDangerAndHiddenNear(); //DOUBT - Check if need to comment this
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
        for ( var row = 0; row < this.game.board.rows; row++ ) {
            for ( var col = 0; col < this.game.board.cols; col++ ) {
                if ( this.game.board.grid[ row ][ col ].danger == this.game.board.grid[ row ][ col ].hiddenNear && this.game.board.grid[ row ][ col ].danger !== 0 ) {
                    for ( var dc = col - 1; dc <= col + 1; dc++ ) {
                        for ( var dr = row - 1; dr <= row + 1; dr++ ) {
                            if ( dr == row && dc == col ) {
                                continue;
                            }
                            if ( dr < 0 || dc < 0 || dr >= this.game.board.rows || dc >= this.game.board.cols ) {
                                continue;
                            }
                            if ( this.game.board.grid[ dr ][ dc ].hidden == true && !this.game.board.grid[ dr ][ dc ].alreadyTargeted ) {
                                var target = {};
                                target[ "row" ] = dr;
                                target[ "col" ] = dc;
                                target[ "needToFlag" ] = true;
                                this.targetsList.push( target );
                                this.game.board.grid[ dr ][ dc ].alreadyTargeted = true;
                            }
                        }
                    }
                }
            }
        }
        console.log( "aiSameDangerAndHiddenNear flags" );
    };

    //method used by our AI solver to click on the neighboring hidden tiles if the value displayed on the tile (danger)
    //and the no. of flags around the tile are same
    this.aiSameDangerAndFlaggedNear = function () {
        for ( var row = 0; row < this.game.board.rows; row++ ) {
            for ( var col = 0; col < this.game.board.cols; col++ ) {
                if ( this.game.board.grid[ row ][ col ].danger == this.game.board.grid[ row ][ col ].flaggedNear && this.game.board.grid[ row ][ col ].flaggedNear != 0 ) {
                    for ( var dc = col - 1; dc <= col + 1; dc++ ) {
                        for ( var dr = row - 1; dr <= row + 1; dr++ ) {
                            if ( dr == row && dc == col ) {
                                continue;
                            }
                            if ( dr < 0 || dc < 0 || dr >= this.game.board.rows || dc >= this.game.board.cols ) {
                                continue;
                            }
                            if ( this.game.board.grid[ dr ][ dc ].hidden == true && !this.game.board.grid[ dr ][ dc ].alreadyTargeted ) {
                                var target = {};
                                target[ "row" ] = dr;
                                target[ "col" ] = dc;
                                target[ "needToFlag" ] = false;
                                this.targetsList.push( target );
                                this.game.board.grid[ dr ][ dc ].alreadyTargeted = true;
                                console.log( "aiSameDangerAndFlaggedNear adds ", dr, dc, " in the targetList" );
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
        for ( var row = 0; row < this.game.board.rows; row++ ) {
            for ( var col = 0; col < this.game.board.cols; col++ ) {
                if ( this.game.board.grid[ row ][ col ].hidden == false && this.game.board.grid[ row ][ col ].isFlagged == false ) {
                    if ( this.game.board.grid[ row ][ col ].danger !== 1 && this.game.board.grid[ row ][ col ].danger !== 0 &&
                        this.game.board.grid[ row ][ col ].danger - this.game.board.grid[ row ][ col ].flaggedNear > 1 ) {
                        for ( var k = 0; k < this.game.board.grid[ row ][ col ].allHiddenNeighbours.length; k++ ) {
                            if ( this.game.board.grid[ row ][ col ].allHiddenNeighbours[ k ].isLinked ) {
                                var numberOfLinked = 0;
                                linkedTilesAdjacentToThis = [];
                                for ( var l = 0; l < this.game.board.grid[ row ][ col ].allHiddenNeighbours[ k ].linkedWith.length; l++ ) {
                                    if ( this.game.board.grid[ row ][ col ].allHiddenNeighbours.includes( this.game.board.grid[ row ][ col ].allHiddenNeighbours[ k ].linkedWith[ l ] ) ) {
                                        numberOfLinked += 1;
                                        linkedTilesAdjacentToThis.push( this.game.board.grid[ row ][ col ].allHiddenNeighbours[ k ].linkedWith[ l ] );
                                    }
                                }
                                if ( numberOfLinked > 1 ) {
                                    if ( this.game.board.grid[ row ][ col ].hiddenNear - ( numberOfLinked - 1 ) === this.game.board.grid[ row ][ col ].danger ) {
                                        for ( var m = 0; m < this.game.board.grid[ row ][ col ].allHiddenNeighbours.length; m++ ) {
                                            if ( !linkedTilesAdjacentToThis.includes( this.game.board.grid[ row ][ col ].allHiddenNeighbours[ m ] ) ) {
                                                temp = this.game.board.grid[ row ][ col ].allHiddenNeighbours[ m ];
                                                var target = {};
                                                target[ "row" ] = temp.row;
                                                target[ "col" ] = temp.col;
                                                target[ "needToFlag" ] = true;
                                                this.targetsList.push( target );
<<<<<<< HEAD
=======
                                                console.log( "aiFindTargetsUsingLinkedInfo clicks" );
>>>>>>> 95d7a748e3fd64c1dcf6c6ebfe6306ae25dd44a9
                                                temp.alreadyTargeted = true;
                                                console.log( "aiFindTargetsUsingLinkedInfo adds ", temp.row, temp.col, " in targetList to Flag" );
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
        if ( this.aiCornerCount < 4 ) {
            while ( true ) {
                var cornerId = Math.floor( Math.random() * 4 );
                if ( this.aiCorners[ cornerId ] == 0 ) {
                    switch ( cornerId ) {
                        case 0:
                            this.aiTargetRow = 0;
                            this.aiTargetCol = 0;
                            break;
                        case 1:
                            this.aiTargetRow = 0;
                            this.aiTargetCol = this.game.board.cols - 1;
                            break;
                        case 2:
                            this.aiTargetRow = this.game.board.rows - 1;
                            this.aiTargetCol = 0;
                            break;
                        case 3:
                            this.aiTargetRow = this.game.board.rows - 1;
                            this.aiTargetCol = this.game.board.cols - 1;
                            break;
                    }
                    this.aiCorners[ cornerId ] = 1;
                    this.aiCornerCount++;
                    this.flagTarget = false;
                    break;
                }
            }
        } else {
            do {
                this.aiTargetRow = Math.floor( Math.random() * this.game.board.rows );
                this.aiTargetCol = Math.floor( Math.random() * this.game.board.cols );
            } while ( this.game.board.grid[ this.aiTargetRow ][ this.aiTargetCol ].hidden == false ||
                this.game.board.grid[ this.aiTargetRow ][ this.aiTargetCol ].isFlagged == true || this.game.board.grid[ this.aiTargetRow ][ this.aiTargetCol ].hasMine == true );
            this.flagTarget = false;
        }
        console.log( "aiClickRandomTile adds ", this.aiTargetRow, this.aiTargetCol, "in the targetList for flagTarget: ", this.flagTarget );
    };

    //stores the x-y coordinates and the action to be performed on it
    this.Target = function ( row, col, needToFlag ) { //DOUBT - is this correct?
        this.row = row;
        this.col = col;
        this.needToFlag = needToFlag;
    };

};

module.exports = AI;