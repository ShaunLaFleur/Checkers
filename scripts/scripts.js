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
        elem.classList.add('colorOne');
      } else {
        elem.classList.add('colorTwo');
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
    x = game.redStartingPositions[i][0];
    y = game.redStartingPositions[i][1];
    game.grid[x][y].occupiedBy = "red";
    game.grid[x][y].element.style.backgroundImage = 'url(redPiece.png)';
  }
}

function startTurn() {
  if(game.teamTurn === "red") {
    game.teamTurn = "black";
  } else {
    game.teamTurn = "red";
  }
  if(checkForJumps(null, null, true)) { // Checks if any jumps are available to the current player.
    game.jumpMode = true; // Sets jump mode to true. This refers to the state in which the current player HAS to jump the opponent.
  }
}

// Used to check for possible jumps. Not the same function that sets these jumps as valid movements. This is used at the beginning of each turn to force jumps.
function checkForJumps(a, b, checkAll) {
  let jumpsPossible = false;
  if(checkAll) {
    for(let y=0; y<game.rows; y++) {
      for(let x=0; x<game.columns; x++){
        if(game.grid[x][y].occupiedBy === game.teamTurn) {
          getValidMoves(x, y, true);
        }
      }
    }
  } else if(!checkAll) {
    getValidMoves(a, b, true);
  }
  if(game.piecesThatCanJump.length !== 0) {
    return true;
  } else if(game.piecesThatCanJump.length === 0) {
    return false;
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
  /*if(game.activeCell.length > 0) {
    getValidMoves(x, y, false); // Single function to get valid moves whether we're jumping or moving to an empty cell. We'll put checks within the function to make sure if jump mode is enabled, we do not set empty cells as valid movements unless it requires a jump.
  }*/
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

// If onlyCheck = true, we are simply looking for possible jumps then returning true or false. Otherwise, we are storing valid moves into an array and highlighting those cells.
function getValidMoves(x, y, onlyCheck) {
  console.log(`Get valid moves called. Active team: ${game.teamTurn}. Checking from cell: X: ${x}, Y: ${y}`);
  let opponent;
  let a;
  let b;
  if(game.teamTurn === "black") {
    opponent = "red";
  } else {
    opponent = "black";
  }
  // Check for empty spot up-left
  if((game.teamTurn === "black" || game.grid[x][y].isKing) && x !== 0 && !game.jumpMode && !onlyCheck && game.grid[x-1][y-1].occupiedBy === "none") {
    setValidMove(x-1, y-1);
  // Check for opponent at up-left
  } else if((game.teamTurn === "black" || game.grid[x][y].isKing) && x !== 0 && game.grid[x-1][y-1].occupiedBy === opponent) {
    a = x-1; // For prettier calculations
    b = y-1; // For prettier calculations
    // Check for empty spot up-left from adjacent enemy piece
    if(a !== 0 && game.grid[a-1][b-1].occupiedBy === "none") {
      if(onlyCheck && !game.grid[x][y].jumpPossible) {
        setJumpPossible(x, y);
      } else if(!onlyCheck) {
        setValidMove(a-1, b-1);
        game.grid[a-1][b-1].jumpRequired = [a, b]; // Sets the coordinates of the cell that must be jumped before landing on this cell.
      }
    }
  }
  // Check for empty spot bottom-left
  if((game.teamTurn === "red" || game.grid[x][y].isKing) && x !== 0 && !game.jumpMode && !onlyCheck && game.grid[x-1][y+1].occupiedBy === "none") {
    setValidMove(x-1, y+1);
  // Check for opponent at bottom-left
  } else if((game.teamTurn === "red" || game.grid[x][y].isKing) && x !== 0 && game.grid[x-1][y+1].occupiedBy === opponent) {
    a = x-1; // For prettier calculations
    b = y+1; // For prettier calculations
    // Check for empty spot bottom-left from adjacent enemy piece
    if(a !== 0 && game.grid[a-1][b+1].occupiedBy === "none") {
      if(onlyCheck && !game.grid[x][y].jumpPossible) {
        setJumpPossible(x, y);
      } else if(!onlyCheck) {
        setValidMove(a-1, b+1);
        game.grid[a-1][b+1].jumpRequired = [a, b];
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
  clearCell(a, b); // Clear the cell we just left
  if(game.grid[x][y].jumpRequired.length !== 0) { // If a piece was jumped
    a = game.grid[x][y].jumpRequired[0];
    b = game.grid[x][y].jumpRequired[1];
    clearCell(a, b); // clear the jumped cell
    if(!checkForJumps(x, y, false)) { // Call the check for jumps function with false to check only the current cell for possible jumps. If there are no more jumps, we can set jump mode to false and end the turn further down.
      game.jumpMode = false; // if no additional jumps were found, we can set jump mode to false to allow us to end the turn
    } else if(checkForJumps(x, y, false)) { // if more jumps were found, we can't end the turn until the player jumps again.
      game.piecesThatCanJump.push([x, y]); // Add current cell coordinates to the pieces that can jump array so we can clear it later
      game.grid[x][y].jumpPossible = true; // Mark this piece as being able to jump another piece so the player can properly click and set it as active during jump mode
    }
  }
  // Update the new cell that was moved to.
  game.grid[x][y].occupiedBy = game.teamTurn;
  game.grid[x][y].validMove = false;
  game.grid[x][y].jumpRequired = [];
  if(game.teamTurn === "red") {
    game.grid[x][y].element.style.backgroundImage = 'url(redPiece.png)';
  } else {
    game.grid[x][y].element.style.backgroundImage = 'url(blackPiece.png)';
  }
  if(!game.jumpMode) { // End turn only if no more jumps are available.
    endTurn();
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