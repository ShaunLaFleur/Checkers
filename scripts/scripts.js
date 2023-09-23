const game = {
  rows: 8,
  columns: 8,
  redStartingPositions: [[0, 0], [2, 0], [4, 0], [6, 0], [1, 1], [3, 1], [5, 1], [7, 1], [0, 2], [2, 2], [4, 2], [6, 2]],
  blackStartingPositions: [[1, 7], [3, 7], [5, 7], [7, 7], [0, 6], [2, 6], [4, 6], [6, 6], [1, 5], [3, 5], [5, 5], [7, 5]],
  grid:[],
  teamTurn: "black",
  activeCell: [],
  validMoves: [],
  jumpMode: false, // When a possible jump is found, we set this to true to force a player to only select pieces that can jump the opponent.
  piecesThatCanJump:[],
  gridDefaults: {
    occupiedBy: "none", // Which teams piece occupies this cell
    isKing: false, // Is the piece occupying this cell a king?
    element: null, // A reference to the DOM element this object represents
    active: false, // Is this cell active or not
    validMove: false, // Is it valid to move to this cell from the active cell
    jumpRequired: [], // The jump required to get from the active cell to this cell.
    jumpPossible: false, // Whether or not a jump is possible FROM this cell.
    bgImage: null, // Used to update cells as we move.
  },
}

window.onload = function() {
  for(let y=0; y<game.rows; y++) {
    for(let x=0; x<game.columns; x++) {
      if(y===0) {
        game.grid.push([]); // Initializes the columns on first passthrough.
      }
      // Create the grid DIV elements
      const container = document.getElementById('container');
      const elem = document.createElement('div');
      container.appendChild(elem);
      elem.setAttribute('data-x', x);
      elem.setAttribute('data-y', y);
      elem.setAttribute('onClick','cellClicked(this)');
      elem.className = "cell";
      if ((x + y) % 2 === 0) {
        elem.classList.add('colorTwo');
      } else {
        elem.classList.add('colorOne');
      }
      // Pushes an object that holds the cells data into it's corresponding column and row.
      game.grid[x][y] = structuredClone(game.gridDefaults);
      game.grid[x][y].element = elem;
    }
  }
  spawnPieces();
}

function spawnPieces() {
  for(let i=0; i<game.blackStartingPositions.length; i++) {
    let x = game.blackStartingPositions[i][0];
    let y = game.blackStartingPositions[i][1];
    game.grid[x][y].occupiedBy = "black";
    game.grid[x][y].element.style.backgroundImage = 'url(blackPiece.png)';
    game.grid[x][y].bgImage = 'url(blackPiece.png)'; // Used to update cells as we move.
    x = game.redStartingPositions[i][0];
    y = game.redStartingPositions[i][1];
    game.grid[x][y].occupiedBy = "red";
    game.grid[x][y].element.style.backgroundImage = 'url(redPiece.png)';
    game.grid[x][y].bgImage = 'url(redPiece.png)'; // Used to update cells as we move.
  }
}

function startTurn() {
  game.teamTurn = (game.teamTurn === "black") ? "red" : "black"; // If game.teamTurn is black, set it to red, otherwise set it to black.
  checkForJumps(null, null, true)// Checks if any jumps are available to the current player and if they are found, turns jumpMode on, forcing the player to jump.
}

// Used to check for possible jumps. Not the same function that sets these jumps as valid movements. This is used at the beginning of each turn to force jumps if they are available by enabling jump mode.
function checkForJumps(a, b, checkAll) {
  // If check all is true, we check all pieces of the current team to see if they can make a jump.
  if(checkAll) {
    for(let y=0; y<game.rows; y++) {
      for(let x=0; x<game.columns; x++){
        if(game.grid[x][y].occupiedBy === game.teamTurn) {
          getValidMoves(x, y, true); // true signals to the function that we are in check only mode. We are only checking to see if jumps are possible, we are not checking for valid movements.
        }
      }
    }
  // Otherwise if checkAll is false, we only check the coordinates that were passed as parameters.
  } else if(!checkAll) {
    getValidMoves(a, b, true);
  }
  if(game.piecesThatCanJump.length !== 0) { // If there are pieces that can make a jump, we turn jumpMode on.
    game.jumpMode = true;
  } else { // If no pieces can make a jump this turn, we turn jumpMode off.
    game.jumpMode = false;
  }
}

function cellClicked(element) {
  const x = parseInt(element.getAttribute("data-x"));
  const y = parseInt(element.getAttribute("data-y"));
  console.log(`Clicked cell X ${x}, Y ${y}`);
  console.log(game.grid[x][y]);
  if(game.grid[x][y].validMove) {
    movePiece(x, y);
  } else if(game.grid[x][y].occupiedBy !== game.teamTurn || (game.grid[x][y].occupiedBy === "none" && !game.grid[x][y].validMove)) {
    return; // then we simply do nothing and return
  } else if(game.grid[x][y].active) { // If the clicked cell is active, we turn it inactive
    removeActive(x, y); // make it inactive
  } else if(!game.grid[x][y].active && game.grid[x][y].occupiedBy === game.teamTurn && !game.jumpMode && game.activeCell.length === 0 || (game.jumpMode && game.grid[x][y].jumpPossible && game.activeCell.length === 0)) { 
    setActive(x, y);
  } else if(!game.grid[x][y].active && game.grid[x][y].occupiedBy === game.teamTurn && !game.jumpMode && game.activeCell.length > 0 || (game.jumpMode && game.grid[x][y].jumpPossible && game.activeCell.length > 0)) {
    a = game.activeCell[0];
    b = game.activeCell[1];
    removeActive(a, b); // then we remove active from the previously clicked cell
    setActive(x, y); // and set active on the currently clicked cell
  }
}

function removeActive(x, y) {
  console.log("called remove active");
  game.grid[x][y].active = false;
  game.grid[x][y].element.classList.remove("active");
  game.activeCell = [];
  clearValidMovesArray();
}

function setActive(x, y) {
  console.log("called setActive");
  game.grid[x][y].active = true;
  game.grid[x][y].element.classList.add("active");
  game.activeCell = [x, y];
  getValidMoves(x, y);
}

function getValidMoves(x, y, onlyCheck) {
  console.log("Get Valid Moves Triggered");
  if(game.teamTurn === "red" || game.grid[x][y].isKing) {
    console.log("Red team check triggered");
    // Check down-left
    checkDirection(x, y, -1, 1, 0, 7, onlyCheck);
    // Check down-right
    checkDirection(x, y, 1, 1, 7, 7, onlyCheck);
  }
  if(game.teamTurn === "black" || game.grid[x][y].isKing) {
    game.log
    // Check up-left
    checkDirection(x, y, -1, -1, 0, 0, onlyCheck);
    // Check up-right
    checkDirection(x, y, 1, -1, 7, 0, onlyCheck);
  }
}

// x and y are the coordinates to start checks from, dx and dy are the adjustments for the x and y coords to determine which direction to check, the next two are for edge checking and then onlyCheck is whether we're only checking for jumps.
function checkDirection(x, y, dx, dy, columnCheck, rowCheck, onlyCheck) {
  console.log("Check direction called");
  let a;
  let b;
  const opponent = (game.teamTurn === "black") ? "red" : "black"; // If game.teamTurn === black, return red, else return black.
  console.log(opponent);
  console.log(`X: ${x}, ${y}`);
  if(x !== columnCheck && y !== rowCheck && !game.jumpMode && !onlyCheck && game.grid[x+dx][y+dy].occupiedBy === "none") {
    console.log("Triggered");
    setValidMove(x+dx, y+dy);
  } else if(x !== columnCheck && y !== rowCheck && game.grid[x+dx][y+dy].occupiedBy === opponent) {
    a = x+dx; // For prettier calculations
    b = y+dy; // For prettier calculations
    // Check for another empty spot on the other side of the found adjacent opponent piece.
    if(a !== columnCheck && b !== rowCheck && game.grid[a+dx][b+dy].occupiedBy === "none") {
      if(onlyCheck && !game.grid[x][y].jumpPossible) {
        setJumpPossible(x, y);
      } else if(!onlyCheck) {
        setValidMove(a+dx, b+dy);
        game.grid[a+dx][b+dy].jumpRequired = [a, b]; // Sets the coordinates of the cell that must be jumped before landing on this cell.
      }
    }
  }
}

function setJumpPossible(x, y) {
  game.grid[x][y].jumpPossible = true;
  game.piecesThatCanJump.push([x,y]);
}

function setValidMove(x, y) {
  console.log("Set valid move called");
  game.grid[x][y].validMove = true;
  game.grid[x][y].element.classList.add("highlight");
  game.validMoves.push([x,y]);
}

function movePiece(x, y) {
  clearPiecesThatCanJumpArray(); // Clear any cells that previously had the marker saying they can jump another piece since the only additional jump allowed is from the piece that just jumped
  game.piecesThatCanJump = []; // Clear the array itself.
  let a = game.activeCell[0]; // Store active piece's column coordinate
  let b = game.activeCell[1]; // Store active piece's row coordinate
  const bgImage = game.grid[a][b].bgImage; // Store the background image from the cell we're leaving
  game.grid[x][y].isKing = game.grid[a][b].isKing; // Transfer King status to the new cell we're moving to in case we need to check for double jumps from that location.
  clearCell(a, b); // Clear the cell we're leaving
  if(game.grid[x][y].jumpRequired.length !== 0) { // If a piece was jumped
    a = game.grid[x][y].jumpRequired[0];
    b = game.grid[x][y].jumpRequired[1];
    clearCell(a, b); // clear the jumped cell
    checkForJumps(x, y, false) // then call the check for jumps function with false to check only the current cell for possible additional jumps. If there are no more jumps, we can set jump mode to false and end the turn further down.
    if(game.jumpMode) {
      clearValidMovesArray(); // If we remain in jump mode, endTurn won't be triggered and thus highlighted cells will not be cleared, so we call it here.
    }
  }
  // Update the new cell that was moved to.
  game.grid[x][y].occupiedBy = game.teamTurn;
  game.grid[x][y].validMove = false;
  game.grid[x][y].jumpRequired = [];
  game.grid[x][y].bgImage = bgImage;
  game.grid[x][y].element.style.backgroundImage = bgImage;
  if(game.teamTurn === "red" && y === 7 || game.teamTurn === "black" && y === 0) {
    kingMaker(x, y);
  }
  if(!game.jumpMode) { // End turn only if no more jumps are available.
    endTurn();
  }
}

function kingMaker(x, y) {
  game.grid[x][y].isKing = true;
  if(game.teamTurn === "red") {
   //game.grid[x][y].element.style.backgroundImage = redKing
   //game.grid[x][y].bgImage = redking
  } else {
  game.grid[x][y].element.style.backgroundImage = 'url(blackKingPiece.png)';
  game.grid[x][y].bgImage = 'url(blackKingPiece.png)';
  }
}

function endTurn() {
  game.jumpMode = false;
  game.activeCell = [];
  clearValidMovesArray();
  clearPiecesThatCanJumpArray();
  startTurn();
}

// Takes each cell from the valid moves array and clears it/resets it to defaults. 
function clearValidMovesArray() {
  for(let i=0; i<game.validMoves.length; i++) {
    const x = game.validMoves[i][0];
    const y = game.validMoves[i][1];
    game.grid[x][y].element.classList.remove("highlight");
    game.grid[x][y].validMove = false;
    game.grid[x][y].jumpRequired = [];
  }
  game.validMoves = [];
}

// Takes each cell from the jumpPossible array and sets its jumpPossible property to false. We don't send them to clearCell() because we aren't setting all properties to default.
// We need to store cells in the jumpPossible array in the case that we have multiple possible jumps. Once we jump, we need to access all of the cells with the possibleJump property set to true and set them back to false.
function clearPiecesThatCanJumpArray() {
  for(let i=0; i<game.piecesThatCanJump.length; i++) {
    const x = game.piecesThatCanJump[i][0];
    const y = game.piecesThatCanJump[i][1];
    game.grid[x][y].jumpPossible = false;
  }
}

function clearCell(x, y) {
  const elem = game.grid[x][y].element; // Store a temporary reference to the DOM element
  elem.classList.remove("highlight"); // Remove the valid move highlight if it exists
  elem.classList.remove("active"); // Remove any active highlighting if it exists
  elem.style.backgroundImage = 'none'; // Remove any displayed pieces if they exist
  game.grid[x][y] = structuredClone(game.gridDefaults); // Set the grid object back to default values
  game.grid[x][y].element = elem; // Restore the reference to the respective DOM element.
}