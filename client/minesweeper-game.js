var ctx = null;

var flagClickCounter=0,totalClickCounter=0;

var gameTime = 0, lastFrameTime = 0;
var currentSecond = 0, frameCount = 0, framesLastSecond = 0;

var finalTime = 0;

var depressedAreas = 0;
var numberCount = 0;
var value3BV = 0;

var clonedGrid = [];
var visited = [];
var affected = [];

var offsetX = 0, offsetY = 0;
var grid = [];

var bombsLeft = 0;
var totalArrangements = 0;
var aiCornerCount = 0;
var aiCorners = [0,0,0,0];
var aiTargetX = 0, aiTargetY = 0;
var flagTarget = false;
var targetsList = [];		//has a list of tiles on which the AI will perform either click or flag action
var aiFlag = false;

//stores x-y coordinates and click status of mouse
var mouseState = {
	x	: 0,
	y	: 0,
	click	: null
};

//sets the game's attributes as per the difficulty level and also the live state of the game
var gameState = {
	difficulty	: 'easy',
	screen		: 'menu',
	newBest		: false,
	timeTaken	: 0,

	tileW		: 25,
	tileH		: 25
};

//defines all the board's attributes as per the difficulty levels
var difficulties = {
	easy	: {
		name		: "Easy",
		width		: 10,
		height		: 10,
		mines		: 10,
		bestTime	: 0,
		menuBox		: [0,0]
	},
	medium	: {
		name		: "Medium",
		width		: 12,
		height		: 12,
		mines		: 20,
		bestTime	: 0,
		menuBox		: [0,0]
	},
	hard	: {
		name		: "Hard",
		width		: 15,
		height		: 15,
		mines		: 50,
		bestTime	: 0,
		menuBox		: [0,0]
	}
};

//stores the x-y coordinates and the action to be performed on it
function Target(x, y, needToFlag) {
	this.x = x;
	this.y = y;
	this.needToFlag = needToFlag;
}

//class to define each tile and all its associated properties
function Tile(x, y)
{
	this.x = x;
	this.y = y;
	this.hasMine = false;
	this.danger	= 0;
	this.currentState = 'hidden';			//defines whether tile is hidden or flagged or visible
	
	// Required information for AI Solver for tile
	this.unknown = false;
	this.probabilityCount = 0;
	this.alreadyTargeted = false;
	this.flaggedNear = 0;							//No of neighbouring flagged tiles
	this.hiddenNear = 0;							//No of neighbouring hidden tiles
	this.allHiddenNeighbours = [];
	this.isLinked = false;
	this.linkedWith = [];							//list of neighbouring hidden tiles with exactly one mine among them
}

//function to calculate the number to be displayed on each visible tile in the grid
Tile.prototype.calcDanger = function()
{
	var cDiff = difficulties[gameState.difficulty];

	for(var py = this.y - 1; py <= this.y + 1; py++)
	{
		for(var px = this.x - 1; px <= this.x + 1; px++)
		{
			if(px==this.x && py==this.y) { continue; }

			if(px < 0 || py < 0 ||
				px >= cDiff.width ||
				py >= cDiff.height)
			{
				continue;
			}

			if(grid[((py*cDiff.width)+px)].hasMine)
			{
				this.danger++;
			}
		}
	}
};

//mark a tile as flagged
Tile.prototype.flag = function()
{
	totalClickCounter++;
	if(this.currentState=='hidden'){
		flagClickCounter++;
		this.currentState = 'flagged';
		bombsLeft--;
	}
	else if(this.currentState=='flagged') {
		flagClickCounter--;
		this.currentState = 'hidden';
		bombsLeft++;
	}
};

//Will perform click action and take respective actions on the neighbouring tiles
Tile.prototype.click = function()
{
	totalClickCounter++;

	if(this.currentState === 'flagged') {
		return; }

	if(this.hasMine) { gameOver(); }
	else if(this.danger>0) {
		this.currentState = 'visible';
		var cDiff = difficulties[gameState.difficulty];
		var flagCount = 0;
		for(var py = this.y - 1; py <= this.y + 1; py++)
		{
			for(var px = this.x - 1; px <= this.x + 1; px++)
			{
				if(px==this.x && py==this.y) { continue; }

				if(px < 0 || py < 0 ||
					px >= cDiff.width ||
					py >= cDiff.height)
				{
					continue;
				}

				var idx = ((py * cDiff.width) + px);

				if(grid[idx].currentState === 'flagged')
				{
					flagCount += 1;
				}
			}
		}
		// console.log("Flags: " + flagCount);

		if(flagCount === this.danger) {
			for(var py = this.y - 1; py <= this.y + 1; py++)
			{
				for(var px = this.x - 1; px <= this.x + 1; px++)
				{
					if(px==this.x && py==this.y) { continue; }

					if(px < 0 || py < 0 ||
						px >= cDiff.width ||
						py >= cDiff.height)
					{
						continue;
					}

					var idx = ((py * cDiff.width) + px);
					if(grid[idx].currentState === 'hidden')
					{
						grid[idx].currentState = 'visible';
						if(grid[idx].hasMine)
							gameOver();
						else if(grid[idx].danger === 0)
							grid[idx].revealNeighbours();
					}
				}
			}
		}
	}
	else {
		this.currentState = 'visible';
		this.revealNeighbours();
	}

	checkState();
};

//reveal all the neighbours of the clicked tile
Tile.prototype.revealNeighbours = function()
{
	var cDiff = difficulties[gameState.difficulty];

	for(var py = this.y - 1; py <= this.y + 1; py++)
	{
		for(var px = this.x - 1; px <= this.x + 1; px++)
		{
			if(px==this.x && py==this.y) { continue; }

			if(px < 0 || py < 0 ||
				px >= cDiff.width ||
				py >= cDiff.height)
			{
				continue;
			}

			var idx = ((py * cDiff.width) + px);

			if(grid[idx].currentState=='hidden')
			{
				grid[idx].currentState = 'visible';

				if(grid[idx].danger==0)
				{
					grid[idx].revealNeighbours();
				}
			}
		}
	}
};

//Recomputes various attributes for each tile in the grid after each click or flag
function computeTileInfo() {
	for(var i in grid) {
		grid[i].hiddenNear = 0;
		grid[i].flaggedNear = 0;
		grid[i].allHiddenNeighbours = [];

		var centerX = grid[i].x;
		var centerY = grid[i].y;
		var cDiff = difficulties[gameState.difficulty];

		for(var py = centerY - 1; py <= centerY + 1; py++)
		//if a neighboring tile was flagged or hidden, it will increase the respective counter for that tile and also add that hidden
		//tile to the 'allHiddenNeighbours' array for that tile
		{
			for(var px = centerX - 1; px <= centerX + 1; px++)
			{
				if(px==centerX && py==centerY) { continue; }

				if(px < 0 || py < 0 || px >= cDiff.width || py >= cDiff.height) {
					continue;
				}

				var idx = ((py * cDiff.width) + px);
				if(grid[idx].currentState === 'hidden') {
					grid[i].hiddenNear += 1;
					grid[i].allHiddenNeighbours.push(grid[idx]);
				}
				if(grid[idx].currentState === 'flagged') {
					grid[i].flaggedNear += 1;
				}
			}
		}
	}

	//code for adding a list of tiles that satisfy the condition of linkedTiles to that array and also taking care
	//of isLinked attribute for that tile
	for(var i in grid) {
		var centerX = grid[i].x;
		var centerY = grid[i].y;
		var cDiff = difficulties[gameState.difficulty];

		if(grid[i].danger - grid[i].flaggedNear === 1 && grid[i].hiddenNear !== 1) {
			var temp = [];
			for(py = centerY - 1; py <= centerY + 1; py++) {
				for(px = centerX - 1; px <= centerX + 1; px++) {
					if(px == centerX && py == centerY) { continue; }
					if(px < 0 || py < 0 || px >= cDiff.width || py >= cDiff.height)
						continue;
					var idx = ((py * cDiff.width) + px);
					if(grid[idx].currentState === 'hidden') {
						temp.push(grid[idx]);
					}

				}
			}
			for(py = centerY - 1; py <= centerY + 1; py++) {
				for(px = centerX - 1; px <= centerX + 1; px++) {
					if(px == centerX && py == centerY) { continue; }
					if(px < 0 || py < 0 || px >= cDiff.width || py >= cDiff.height)
						continue;
					var idx = ((py * cDiff.width) + px);
					if(grid[idx].currentState === 'hidden') {
						grid[idx].linkedWith = [];
						for(var linkedIdx in temp) {
							grid[idx].linkedWith.push(temp[linkedIdx]);
						}
						grid[idx].isLinked = true;
					}
				}
			}

		}
	}
}

//checks state of the game and takes actions accordingly
function checkState()
{
	for(var i in grid)
	{
		if(grid[i].hasMine==false && grid[i].currentState!='visible')
		{
			return;
		}
	}

	gameState.timeTaken = gameTime;
	var cDiff = difficulties[gameState.difficulty];

	if(cDiff.bestTime==0 ||
		gameTime < cDiff.bestTime)
	{
		gameState.newBest = true;
		cDiff.bestTime = gameTime;
	}

	gameState.screen = 'won';
	finalTime = Math.round(gameState.timeTaken/1000);

}

//function to change the game's state to lost
function gameOver()
{
	gameState.screen = 'lost';
}

//used for calculation of 3BV - Bechtel's Board Benchmark Value for the Result Section
function generateArrays(){
	for (var idx in grid) {
        if (grid[idx].hasMine === true)
            clonedGrid.push(-1);
        else if (grid[idx].danger === 0)
            clonedGrid.push(0);
        else
			clonedGrid.push(1);
		visited.push(false);
		affected.push(false);
	}

	for(var index = 0; index < clonedGrid.length; index++){
		if(clonedGrid[index] === 0){
				calculate3BV(index);
				depressedAreas++;
		}
	}
}

//calculates 3BV for the Result Section
function calculate3BV( idx) {
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
		var cDiff = difficulties[gameState.difficulty];
		for (var py = grid[idx].y - 1; py <= grid[idx].y + 1; py++) {
			for (var px = grid[idx].x - 1; px <= grid[idx].x + 1; px++) {
				if (px == grid[idx].x && py == grid[idx].y) { continue; }

				if (px < 0 || py < 0 ||
					px >= cDiff.width ||
					py >= cDiff.height) {
					continue;
				}
				clonedGrid[idx] = -1;
				visited[idx] = true;
				var index = py * difficulties[gameState.difficulty].width + px;

				affected[index] = true;
				calculate3BV(index);

			}

		}

	}
}

//called when any level is started, creates the Board, places mines randomly, also calls method to calculate 3BV
//for that Board
function startLevel(diff)
{
	gameState.newBest	= false;
	gameState.timeTaken	= 0;
	gameState.difficulty	= diff;
	gameState.screen	= 'playing';

	flagClickCounter = 0;
	totalClickCounter = 0;
	gameTime		= 0;
	lastFrameTime		= 0;

	grid.length		= 0;
	finalTime = 0;
	clonedGrid.length = 0;
	affected.length = 0;
	visited.length = 0;

	depressedAreas = 0;
	numberCount = 0;
	value3BV = 0;

	aiCornerCount = 0;
	aiCorners = [0,0,0,0];
	aiTargetX = 0, aiTargetY = 0;
	flagTarget = false;
	targetsList = [];
	aiFlag = false;

	var cDiff = difficulties[diff];

	bombsLeft = cDiff.mines;

	offsetX = Math.floor((document.getElementById('game').width -
			(cDiff.width * gameState.tileW)) / 2);

	offsetY = Math.floor((document.getElementById('game').height -
			(cDiff.height * gameState.tileH)) / 2);

	for(var py = 0; py < cDiff.height; py++)
	{
		for(var px = 0; px < cDiff.width; px++)
		{
			var idx = ((py * cDiff.width) + px);

			grid.push(new Tile(px, py));
		}
	}

	var minesPlaced = 0;

	while(minesPlaced < cDiff.mines)
	{
		var idx = Math.floor(Math.random() * grid.length);

		if(grid[idx].hasMine) { continue; }

		grid[idx].hasMine = true;
		minesPlaced++;
	}

	for(var i in grid) { grid[i].calcDanger(); }


	generateArrays();

	for(var ind = 0; ind < clonedGrid.length; ind++)
	 	if(clonedGrid[ind] === 1)
					numberCount++;

	value3BV = depressedAreas + numberCount;
}

//add all connected tiles to the section
function addConnected(section, i, j){
	var cDiff = difficulties[gameState.difficulty];
	section.push(grid[(j * cDiff.width) + i]);
	for (var m = 0; m < cDiff.width; m++) {
		for (var n = 0; n < cDiff.height; n++) {
			var idx = (n * cDiff.width) + m;
			if (grid[idx].currentState != 'hidden' && grid[idx].currentState != 'flagged' && !section.includes(grid[idx])) {
				for (var k = 0; k < grid[idx].allHiddenNeighbours.length; k++) {
					if (grid[idx].allHiddenNeighbours.includes(grid[idx].allHiddenNeighbours[k])) {
						addConnected(section, m, n);
						break;
					}
				}
			}
		}
	}
}

//returns whether or not this checking array(an array of tiles which will be bombs) is a viable option 
function solution(checking, section) {
	for (var i = 0; i< section.length; i++) {
		var count = 0;
		for (var j = 0; j < section[i].allHiddenNeighbours.length; j++) {
			if (checking.includes(section[i].allHiddenNeighbours[j])) {//count the number of the hidden tiles near the tile that are in the tested solution
				count++;
			}
		}
		if (count != section[i].danger - section[i].flaggedNear) {//if the number of boombs that the tile (in section) needs to be finished is not = count then this is not a solution
			return false;
		}
	}
	return true;
}

//returns whether or not this checkign array (an array of tiles which will be bombs) has already violated the section,
//i.e  if any of the tiles have more bombs then it says on the tile
//might need to add more to violated like when there isnt enough bombs
function violated(checking, checkingInt, hiddens, section) {
	for (var i = 0; i< section.length; i++) {
		var count = 0;
		var missed = 0;
		for (var j = 0; j < section[i].allHiddenNeighbours.length; j++) {
			if (checking.includes(section[i].allHiddenNeighbours[j])) {//count the number of the hidden tiles near the tile that are in the tested solution
				count++;
			} else {
				if (hiddens.indexOf(section[i].allHiddenNeighbours[j]) < checkingInt[checkingInt.length-1]) {
					//if the tile has been missed then count it as missed
					missed ++;
				}
			}
		}
		if (count > section[i].danger - section[i].flaggedNear) {//if the number of boombs that the tile (in section) needs to be finished is less then count then it is violated 
		  	return true;
		}
		if (section[i].danger - section[i].flaggedNear > section[i].hiddenNear - missed ) {//if the number of bombs required is less than the amout of spaces left unmissed then you fucked up
		  	return true;
		}
	}
  
    return false;//still good
}

//returns all the bomb arrangemnets possible in this section
function getSolutions(section){
	hiddensInSection = [];
    for (var i = 0; i< section.length; i++) {
		for (var j = 0; j < section[i].allHiddenNeighbours.length; j++) {
			//add all the hidden tiles in this section to a list
			if (!hiddensInSection.includes(section[i].allHiddenNeighbours[j])) {
				hiddensInSection.push(section[i].allHiddenNeighbours[j]);
			}
		}
    }

    solutions = [];
    big = [];
    checking = []; 
    checkingInt = [];
    tempList = [];

    for (var i = 0; i < hiddensInSection.length; i++) {
		checkingInt = [];
		checkingInt.push(i);
		big.push(checkingInt);
    }

    while (true) {
		if (big.length != 0){
			checkingInt = big.pop();
		} else {	//once there are no more options to check
			break;
		}

		checking = [];
		for (var i = 0; i< checkingInt.length; i++) {
			checking.push(hiddensInSection[checkingInt[i]]);
		}

		if (solution(checking, section)) {
			solutions.push(checking);
		}else {	//checking is not a solution
			//if its voilated the ruiles of minesweeper then ignore it
			//if the checking list has not yet voilated the section then add more bombs to it
			if (!violated(checking, checkingInt, hiddensInSection, section)) {
				for (var i = checkingInt[checkingInt.length-1] +1; i < hiddensInSection.length; i++ ) {//extend checking by one number with all possible ones
					tempList = JSON.parse(JSON.stringify(checkingInt));
					tempList.push(i);
					big.push(tempList);
				}
			}
		}
    }

    return solutions;
}

//factorial
function fact(n) {
    if (n == 1) {
      	return 1;
    } else {
		result = n;
		result *= (fact(n-1));
		return result;
    }
}

function numberOfCombinations(n, r) {	//used for nCr
	if (r == 0) {
		return 1;
	}
	result = 1;
	for (var i = 0; i < r; i++) {
		result *= (n - i);
	}
	result /= fact(r);
	return result;
}

//this function sets the probability of every tile
function aiSetProbabilities(){
	//count the number of unknown tiles
    //unknown tiles being tiles we have no information about
	var unknownCount = 0;
	var cDiff = difficulties[gameState.difficulty];
	for (var i = 0; i< cDiff.width; i++) {//for each tile
		for (var j = 0; j< cDiff.height; j++) {
		  	if (grid[((j * cDiff.width) + i)].currentState == 'hidden') {
				var unknownTile = true;
				grid[((j * cDiff.width) + i)].unknown = false;
				if ( i > 0 && grid[((j * cDiff.width) + i-1)].currentState != 'hidden') unknownTile = false;
				if (i < cDiff.width-1 && grid[((j * cDiff.width) + i+1)].currentState != 'hidden') unknownTile = false;
				if (i > 0 && j > 0 &&  grid[(((j-1) * cDiff.width) + i-1)].currentState != 'hidden') unknownTile = false;
				if (i < cDiff.width-1 && j > 0 &&  grid[(((j-1) * cDiff.width) + i+1)].currentState != 'hidden') unknownTile = false;
				if (i > 0 && j < cDiff.height-1 &&  grid[(((j+1) * cDiff.width) + i-1)].currentState != 'hidden') unknownTile = false;
				if (i < cDiff.width-1 && j < cDiff.height-1 && grid[(((j+1) * cDiff.width) + i+1)].currentState != 'hidden') unknownTile = false;
				if (j < cDiff.height-1 && grid[(((j+1) * cDiff.width) + i)].currentState != 'hidden') unknownTile = false;
				if (j > 0 &&  grid[(((j-1) * cDiff.width) + i)].currentState != 'hidden') unknownTile = false;
				if (unknownTile) {
					grid[((j * cDiff.width) + i)].unknown = true;
					unknownCount++;
				}
		  	}
		}
	}
	
    //now we need to identify independent sections 
    //the mine field can be broken up into seperate sections, if two tiles are in different sections then they have no effect on each other
    //for example if you had a section of hidden tiles in the top left and a block of hidden tiles in the bottom right corner then they essentually have nothing to do with each other
	sections = [];
	
	for (var i = 0; i< cDiff.width; i++) {//for each tile
		for (var j = 0; j< cDiff.height; j++) {
			var idx = (j * cDiff.width) + i;
			if (grid[idx].currentState != 'hidden' && grid[idx].currentState != 'flagged' && grid[idx].hiddenNear - grid[idx].flaggedNear != 0) {
				var alreadyInSection = false;
				for (var k = 0; k< sections.length; k++) {//for each section
					if (sections[k].includes(grid[idx])) {//if the tile is already in this section then
						alreadyInSection = true;
						break;
					}
				}
	
				if (!alreadyInSection) {
				//if not in section then we have a new section so add it
					newSection = [];
					addConnected(newSection, i, j);
					sections.push(newSection);
				}
			}
		}
	}
	
	//so the sections should be defined
	sectionSolutions = [];
	

    //now we need to search for all possible positions that the bombs should be in
    for (var i = 0; i< sections.length; i++) {
		sectionSolutions.push(getSolutions(sections[i]));
	}

    sectionSelections = [];

    //this is an list of all possible bomb arrangements
    allBombArrangements = [];

    var finished = false;
    
	//in order to populate the allBombArrangements list we need to combine the section solutions 
    while (!finished) {
		temp = [];
		for (var i = 0; i < sections.length; i++) {
			if(sectionSolutions[i][sectionSelections[i]] !== undefined){
			for (var j = 0; j < sectionSolutions[i][sectionSelections[i]].length; j++) {
				temp.push( sectionSolutions[i][sectionSelections[i]][j]);
			}}
		}
  
		if (temp.length <= bombsLeft) {
		  allBombArrangements.push(temp);
		}
  
		for (var i = sections.length-1; i >= 0; i--) {
			sectionSelections[i] +=1;
			if (sectionSelections[i] >= sectionSolutions[i].length) {//if the selection is out of bounds
				if (i ==0) {
					finished = true;
					break;
				}
				sectionSelections[i] = 0;
			} else {
				break;
			}
		}
	}
  
	
	//finally we have a list containing all the possible lists of bomb configurations
    //now we just need to go through the arrangements and add the number of times each tile is a bomb

    for (var i = 0; i< cDiff.width; i++) {
		for (var j = 0; j< cDiff.height; j++) {
		  	grid[(j * cDiff.width) + i].probabilityCount = 0;
		}
	}
	totalArrangements = 0;
	//since the remaining bombs can be arranged in any way amoungst the unknown tiles then the number of 
	//arrangements for this element of allBombArrangements is nCr where n is the number
	//of unknown spaces left and r is the number of bombs left
	//this is where the numbers get very big 
	for(var i = 0; i < allBombArrangements.length; i++) {
		var numberOfBombsLeft = bombsLeft - allBombArrangements[i].length; //get the number fo bombs left to be placed in unknown areas
		combinations = numberOfCombinations(unknownCount, numberOfBombsLeft);
		
		totalArrangements += combinations;
  
		for (var j = 0; j < allBombArrangements[i].length; j++) {		//for each tile which is a bomb in this arrangement add the number of combinations that this arrangment has
		  	allBombArrangements[i][j].probabilityCount += combinations;
		}
	}
}

function aiEarlyGuess(firstGuess){
	//note in minesweeper the first guess is never a bomb so just keep guessing until I get not a bomb on the first guess
    //count the number of corners left
	var count = 0;
	var cDiff = difficulties[gameState.difficulty];
	// count += (grid[(0)].currentState == 'hidden' && !(grid[(0)].currentState == 'flagged') &&!(firstGuess && grid[(0)].hasMine)) ? 1:0;
    // count += (grid[((cDiff.height-1 * cDiff.width))].currentState == 'hidden' && !(grid[((cDiff.height-1 * cDiff.width))].currentState == 'flagged') &&!(firstGuess && grid[(cDiff.height-1 * cDiff.width)].hasMine)) ? 1:0;
    // count += (grid[((cDiff.width-1))].currentState == 'hidden' && !(grid[((cDiff.width-1))].currentState == 'flagged') &&!(firstGuess && grid[((cDiff.width-1))].hasMine)) ? 1:0;
	// count += (grid[(((cDiff.height-1 * cDiff.width) + cDiff.width-1))].currentState == 'hidden' && !(grid[(((cDiff.height-1 * cDiff.width) + cDiff.width-1))].currentState == 'flagged') &&!(firstGuess && grid[(((cDiff.height-1 * cDiff.width) + cDiff.width-1))].hasMine)) ? 1:0;
	
	// start by clicking corners
	var cornerId = Math.floor(Math.random() * 4);
	if(aiCornerCount<4){
		if(aiCorners[cornerId]==0){
			switch(cornerId){
				case 0:
					aiTargetX = 0;
					aiTargetY = 0;
					break;
				case 1:
					aiTargetX = 0;
					aiTargetY = cDiff.height-1;
					break;
				case 2:
					aiTargetX = cDiff.width-1;
					aiTargetY = 0;
					break;
				case 3:
					aiTargetX = cDiff.width-1;
					aiTargetY = cDiff.height-1;
					break;
			}
			aiCorners[cornerId] = 1;
			aiCornerCount++;
		}
	}
	else{
		do{
			aiTargetX = Math.floor(Math.random() * cDiff.width);
			aiTargetY = Math.floor(Math.random() * cDiff.height);
		}while(grid[((aiTargetY * cDiff.width) + aiTargetX)].currentState != 'hidden');
		grid[((aiTargetY * cDiff.width) + aiTargetX)].click();
	}
}

//method used by our AI solver to click on the corners of the Board if it finds no other better action to perform
function aiClickRandomTile() {
	var cDiff = difficulties[gameState.difficulty];
	//if there are too many bombs left the number of arrangements get stupid high and it there are too many 
	//then just guess randomly
	//if( bombsLeft < cDiff.mines/2){
		console.log("aiClickRandomTile - Probability clicks");
		aiSetProbabilities();
		var first = true;
		min = 1000000000;
		var minI = 0;
		var minJ = 0;
		//get the smallest probability 
		for (var i = 0; i< cDiff.width; i++) {
			for (var j = 0; j< cDiff.height; j++) {
				var idx = (j * cDiff.width) + i;
				if (grid[idx].currentState!='flagged' && grid[idx].currentState!='hidden' && !grid[idx].unknown &&( first || grid[idx].probabilityCount <= min)) {
					minI = i;
					minJ= j;
					min = grid[idx].probabilityCount;
					first = false;
				}
			}
		}
  
		//target the smallest probability
		aiTargetX = minI;
		aiTargetY = minJ;
		flagTarget = false;
	// }
	// else{	//if too many bombs then guess
	// 	aiEarlyGuess(false);
	// 	console.log("aiClickRandomTile - Early Guess clicks");
	// }
}

//method used by our AI solver to click on the neighboring hidden tiles if the value displayed on the tile (danger)
//and the no. of flags around the tile are same
function aiSameDangerAndFlaggedNear(){
	for(var i in grid){
		if(grid[i].danger == grid[i].flaggedNear){
			var centerX = grid[i].x;
			var centerY = grid[i].y;
			var cDiff = difficulties[gameState.difficulty];
			for(var py = centerY - 1; py <= centerY + 1; py++)
			{
				for(var px = centerX - 1; px <= centerX + 1; px++)
				{
					if(px==centerX && py==centerY) { continue; }

					if(px < 0 || py < 0 ||
						px >= cDiff.width ||
						py >= cDiff.height)
					{
						continue;
					}

					var idx = ((py * cDiff.width) + px);
					if(grid[idx].currentState=='hidden' && !grid[idx].alreadyTargeted){
						targetsList.push(new Target(px, py, false));
						console.log("aiSameDangerAndFlaggedNear clicks");
						grid[idx].alreadyTargeted = true;
					}
				}
			}
		}
	}
}

//method used by our AI solver to flag the neighboring hidden tiles if the value displayed on the tile (danger)
//and the no. of hidden tiles around the tile are same
function aiSameDangerAndHiddenNear(){
	for(var i in grid){
		if(grid[i].danger == grid[i].hiddenNear && grid[i].danger !== 0){
			//console.log("Flagging all hidden: ", grid[i].x, grid[i].y, grid[i].danger, grid[i].hiddenNear);
			var centerX = grid[i].x;
			var centerY = grid[i].y;
			var cDiff = difficulties[gameState.difficulty];
			for(var py = centerY - 1; py <= centerY + 1; py++)
			{
				for(var px = centerX - 1; px <= centerX + 1; px++)
				{
					if(px==centerX && py==centerY) { continue; }

					if(px < 0 || py < 0 || px >= cDiff.width || py >= cDiff.height) {
						continue;
					}

					var idx = ((py * cDiff.width) + px);
					if(grid[idx].currentState=='hidden' && !grid[idx].alreadyTargeted) {
						targetsList.push(new Target(px, py, true));
						console.log("aiSameDangerAndHiddenNear flags");
						grid[idx].alreadyTargeted = true;
					}
				}
			}
		}
	}
}

//method used by our AI solver, to add a list of tiles (that are safe to click at) to the 'targetList'
//logic for safe tiles is such that mutually excluded set of tiles from the intersection of all the set of tiles
//in the array of 'linkedWith'
function aiFindTargetsUsingLinkedInfo() {
	for(var i in grid) {
		if(grid[i].currentState === 'visible') {
			if(grid[i].danger !== 1 && grid[i].danger !== 0 && grid[i].danger - grid[i].flaggedNear > 1) {
				for(var k = 0; k < grid[i].allHiddenNeighbours.length; k++) {
					if(grid[i].allHiddenNeighbours[k].isLinked) {
						var numberOfLinked = 0;
						linkedTilesAdjacentToThis = [];
						for(var l = 0; l < grid[i].allHiddenNeighbours[k].linkedWith.length; l++) {
							if(grid[i].allHiddenNeighbours.includes(grid[i].allHiddenNeighbours[k].linkedWith[l])) {
								numberOfLinked += 1;
								linkedTilesAdjacentToThis.push(grid[i].allHiddenNeighbours[k].linkedWith[l]);
							}
						}
						if(numberOfLinked > 1) {
							if(grid[i].hiddenNear - (numberOfLinked - 1) === grid[i].danger) {
								for(var m = 0; m < grid[i].allHiddenNeighbours.length; m++) {
									if(!linkedTilesAdjacentToThis.includes(grid[i].allHiddenNeighbours[m])) {
										temp = grid[i].allHiddenNeighbours[m];
										targetsList.push(new Target(temp.x, temp.y, true));
										console.log("aiFindTargetsUsingLinkedInfo clicks");
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

//method called when User chooses the game to be played by the UI.
function aiSolver() {
	var cDiff = difficulties[gameState.difficulty];

	// Make a move
	var tempTile = grid[aiTargetY * cDiff.width + aiTargetX];
	if(!flagTarget) {
		if(tempTile.currentState === 'flagged') {
			console.log("Incorrect click attempt.");
		}
		else {
			tempTile.click();
		}
	}
	else {
		if(tempTile.currentState !== 'flagged') {
			tempTile.flag();
		}
	}

	// Recompute Tile Info due to newly revealed information
	computeTileInfo();

	// Remove any tiles which are present in targetsList if they have been revealed
	// This will save a click
	for(var i = 0; i < targetsList.length; i++) {
		tempTile2 = grid[ targetsList[i].y * cDiff.width + targetsList[i].x ];
		if(tempTile2.currentState !== 'hidden') {
			targetsList.splice(i);
			i--;
		}
	}

	// Get the next target from the targetsList
	if(targetsList.length !== 0) {
		aiTargetX = targetsList[0].x;
		aiTargetY = targetsList[0].y;
		if(targetsList[0].needToFlag){
			flagTarget = true;
			console.log("targetList flags");}
		else{
			flagTarget = false;
			console.log("targetList clicks");}
		targetsList.shift();

	}
	else {		// All previously computed targets have been exhausted
		findNewTarget();
	}
}

// Use obtained information to determine whether any new targets are generated
function findNewTarget() {
	// Any tile having equal danger and hidden tiles -> All hidden tiles are mines
	//aiSameDangerAndHiddenNear();
	// Any tile having equal danger and flagged tiles -> All hidden tiles are safe
	aiSameDangerAndFlaggedNear();
	// If still no new targets revealed - check using linked configurations
	if(targetsList.length === 0)
		aiFindTargetsUsingLinkedInfo();
	// Even if there's still no new targets - All hope lost, random guess
	if(targetsList.length === 0)
		aiClickRandomTile();
}

// updateGame handles the mouse clicks on the board made by the player
function updateGame()
{
	if(gameState.screen=='menu')
	{
		if(mouseState.click!=null)
		{
			for(var i in difficulties)
			{
				if(mouseState.y >= difficulties[i].menuBox[0] &&
					mouseState.y <= difficulties[i].menuBox[1])
				{
					startLevel(i);
					if (confirm("Do you want the AI to solve it?")) {
						aiFlag = true;
						mouseState.click = null;
						gameState.screen = "AIplaying";
						return;
					}
					break;
				}
			}
			mouseState.click = null;
		}
	}
	else if(gameState.screen=='won' || gameState.screen=='lost')
	{
		if(mouseState.click!=null)
		{
			gameState.screen = 'menu';
			mouseState.click = null;
		}
	}
	else
	{
		if(mouseState.click!=null)
		{
			var cDiff = difficulties[gameState.difficulty];

			if(mouseState.click[0]>=offsetX &&
				mouseState.click[1]>=offsetY &&
				mouseState.click[0]<(offsetX + (cDiff.width * gameState.tileW)) &&
				mouseState.click[1]<(offsetY + (cDiff.height * gameState.tileH)))
			{
				var tile = [
					Math.floor((mouseState.click[0]-offsetX)/gameState.tileW),
					Math.floor((mouseState.click[1]-offsetY)/gameState.tileH)
				];

				if(mouseState.click[2]==1)
				{
					grid[((tile[1] * cDiff.width) + tile[0])].click();
				}
				else
				{
					grid[((tile[1] * cDiff.width) + tile[0])].flag();
				}
			}
			else if(mouseState.click[1]>=380)
			{
				gameState.screen = 'menu';
			}

			mouseState.click = null;
		}
	}
}

//method called repeatedly, in order to display the Board's UI
window.onload = function()
{
	ctx = document.getElementById('game').getContext('2d');

	// Event listeners
	document.getElementById('game').addEventListener('click', function(e) {
		var pos = realPos(e.pageX, e.pageY);
		mouseState.click = [pos[0], pos[1], 1];
	});
	document.getElementById('game').addEventListener('mousemove',
	function(e) {
		var pos = realPos(e.pageX, e.pageY);
		mouseState.x = pos[0];
		mouseState.y = pos[1];
	});

	document.getElementById('game').addEventListener('contextmenu',
	function(e) {
		e.preventDefault();
		var pos = realPos(e.pageX, e.pageY);
		mouseState.click = [pos[0], pos[1], 2];
		return false;
	});

	requestAnimationFrame(drawGame);
};

//method that updates UI when the game's state is 'menu'
function drawMenu()
{
	ctx.textAlign = 'center';
	ctx.font = "bold 26pt sans-serif";
	ctx.fillStyle = "#000000";

	var y = 180;

	for(var d in difficulties)
	{
		var mouseOver = (mouseState.y>=(y-30) && mouseState.y<=(y+10));

		if(mouseOver) { ctx.fillStyle = "#000099"; }

		difficulties[d].menuBox = [y-20, y+10];
		ctx.fillText(difficulties[d].name, 400, y);
		y+= 80;

		if(mouseOver) { ctx.fillStyle = "#000000"; }
	}

	var y = 210;
	ctx.font = "italic 12pt sans-serif";

	for(var d in difficulties)
	{
		if(difficulties[d].bestTime==0)
		{
			ctx.fillText("No best time", 400, y);
		}
		else
		{
			var t = difficulties[d].bestTime;
			var bestTime = "";
			if((t/1000)>=60)
			{
				bestTime = Math.floor((t/1000)/60) + ":";
				t = t % (60000);
			}
			bestTime+= Math.floor(t/1000) +
				"." + (t%1000);
			ctx.fillText("Best time   " + bestTime, 400, y);
		}
		y+= 80;
	}
}

//method that updates UI when the game's state is 'playing'
function drawPlaying()
{
	var halfW = gameState.tileW / 2;
	var halfH = gameState.tileH / 2;

	var cDiff = difficulties[gameState.difficulty];

	ctx.textAlign = "center";
	ctx.textBaseline = "bottom";

	ctx.fillStyle = "#000000";
	ctx.font = "20px Roboto";
	ctx.fillText(cDiff.name, 400, 30);

	ctx.fillStyle = "#1e4c6b";
	ctx.font = "bold 18px Roboto";
	ctx.fillText("Return to Menu", 400, 480);

	if(gameState.screen!='lost')
	{
		ctx.textAlign = "left";
		var x = cDiff.mines - flagClickCounter;
		ctx.fillText("💣: " + x, 225, 50);

		var whichT = (gameState.screen=='won' ?
			gameState.timeTaken : gameTime);
		var t = '';
		if((gameTime / 1000) > 60)
		{
			t = Math.floor((whichT / 1000) / 60) + ':';
		}
		var s = Math.floor((whichT / 1000) % 60);
		t+= (s > 9 ? s : '0' + s);

		ctx.textAlign = "right";
		ctx.fillText("⏱️: " + Math.round( (whichT / 1000).toPrecision(6), 2) + " s", 560, 50);
	}

	if(gameState.screen=='lost' || gameState.screen=='won')
	{
		ctx.textAlign = "center";
		ctx.font = "bold 20px sans-serif";



		if(gameState.screen == 'won'){
			document.getElementById("results").innerHTML = "Results";
			if(aiFlag==false)document.getElementById("noOfClicks").innerHTML = "Total Clicks: "+ totalClickCounter;
			document.getElementById("3BV").innerHTML = "3BV : "+ value3BV;
			var efficiency = Math.round((value3BV/totalClickCounter)*100);
			if(aiFlag==false)document.getElementById("efficiency").innerHTML = "Efficiency: "+efficiency + "&percnt;";
			document.getElementById("time").innerHTML = "Total time taken: "+finalTime +" seconds";
		}

		ctx.fillText(
			(gameState.screen=='lost' ?
				"Game Over" : "Cleared!"), 400, offsetY - 15);
	}

	ctx.strokeStyle = "#999999";
	ctx.strokeRect(offsetX, offsetY,
		(cDiff.width * gameState.tileW),
		(cDiff.height * gameState.tileH));

	ctx.font = "bold 14px monospace";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for(var i in grid)
	{
		var px = offsetX + (grid[i].x * gameState.tileW);
		var py = offsetY + (grid[i].y * gameState.tileH);

		if(gameState.screen=='lost' && grid[i].hasMine)
		{
			ctx.fillStyle = "#ff9191";
			ctx.font = "bold 14px monospace";
			ctx.fillRect(px, py,
				gameState.tileW, gameState.tileH);
			ctx.fillStyle = "#000000";
			ctx.fillText("💣", px + halfW, py + halfH);
		}
		else if(grid[i].currentState=='visible')
		{
			ctx.fillStyle = "#dddddd";

			if(grid[i].danger)
			{
				ctx.fillStyle = "#000000";
				ctx.fillText(grid[i].danger, px + halfW, py + halfH);
			}
		}
		else
		{
			ctx.fillStyle = "#cccccc";
			ctx.fillRect(px, py,
				gameState.tileW, gameState.tileH);
			ctx.strokeRect(px, py,
				gameState.tileW, gameState.tileH);

			if(grid[i].currentState=='flagged')
			{
				ctx.fillStyle = "#0000cc";
				ctx.fillText("🚩", px + halfW, py + halfH);
			}
		}
	}
}

//called repeatedly to display UI
function drawGame()
{
	if(ctx==null) { return; }
	if(gameState.screen=='menu'){
		document.getElementById("results").innerHTML = "";
		document.getElementById("noOfClicks").innerHTML = "";
		document.getElementById("3BV").innerHTML = "";
		// var efficiency = Math.round((value3BV/totalClickCounter)*100);
		document.getElementById("efficiency").innerHTML = "";
		document.getElementById("time").innerHTML = "";
	}
	// Frame & update related timing
	var currentFrameTime = Date.now();
	if(lastFrameTime==0) { lastFrameTime = currentFrameTime; }
	var timeElapsed = currentFrameTime - lastFrameTime;
	gameTime+= timeElapsed;

	// Update game
	if(gameState.screen == "AIplaying")
		aiSolver();//updateGame();
	else{
		updateGame();
	}
	// Frame counting
	var sec = Math.floor(Date.now()/1000);
	if(sec!=currentSecond)
	{
		currentSecond = sec;
		framesLastSecond = frameCount;
		frameCount = 1;
	}
	else { frameCount++; }

	// Clear canvas
	ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
	ctx.fillRect(0, 0, 800, 500);
	ctx.fillStyle = "rgb(240, 20, 20)";
	ctx.strokeRect(0, 0, 800, 500);

	if(gameState.screen=='menu') { drawMenu(); }
	else { drawPlaying(); }

	// Draw the frame count
	ctx.textAlign = "left";
	ctx.font = "10pt sans-serif";
	ctx.fillStyle = "#000000";
	ctx.fillText("Framerate: " + framesLastSecond, 20, 20);

	// Update the lastFrameTime
	lastFrameTime = currentFrameTime;

	// Wait for the next frame...
	requestAnimationFrame(drawGame);
}

//translates the coordinates clicked by the mouse to the x-y coordinates for the Board.
function realPos(x, y)
{
	var p = document.getElementById('game');

	do {
		x-= p.offsetLeft;
		y-= p.offsetTop;

		p = p.offsetParent;
	} while(p!=null);

	return [x, y];
}
