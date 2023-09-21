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
      game.grid[x].push({
        occupiedBy:"none", // Stores a string representing what piece occupies this cell. Either "red", "black" or "none".
        isKing: false,
        element:elem, // Stores a reference to it's respective DIV element for easier manipulation later.
        active: false, // For second click functionality. If this cell is active, we can click it again to make it inactive.
        validMove: false,
        jumpedCell:[], // Holds the coordinates to the cell that will be jumped if the piece is moved here
        jumpPossible: false, // Used to force players to jump.
      });
    }
  }
  spawnPieces();
}

function spawnPieces() {
  for(let i=0; i<game.blackStartingPositions.length; i++) {
    let x = game.blackStartingPositions[i][0];
    let y = game.blackStartingPositions[i][1];
    game.grid[x][y].occupiedBy = "black";
    game.grid[x][y].element.style.backgroundImage = 'url(blackPiece.png';
    x = game.redStartingPositions[i][0];
    y = game.redStartingPositions[i][1];
    game.grid[x][y].occupiedBy = "red";
    game.grid[x][y].element.style.backgroundImage = 'url(redPiece.png';
  }
}

function startTurn() {
  if(game.teamTurn === "red") {
    game.teamTurn === "black";
  } else {
    game.teamTurn === "red";
  }
  if(checkForJumps(true)) { // Checks if any jumps are available to the current player.
    game.jumpMode = true; // Sets jump mode to true. This refers to the state in which the current player HAS to jump the opponent.
  }
}

// Used to check for possible jumps. Not the same function that sets these jumps as valid movements. This is used at the beginning of each turn to force jumps.
function checkForJumps(checkAll) {
  if(checkAll) {
    for(y=0; i<game.rows; y++) {
      for(x=0; x<game.columns; x++){
        if(getValidMoves(x, y, true)) { // Calls the function to find valid moves with the checkOnly parameter set to true so we do not highlight any valid cells or move them into the valid moves array. We only want to check for jumps and enable jump mode if found.
          return true;
        }
      }
    }
  } else if(!checkAll) {
    if(getValidMoves(x, y, false)) {
      return true;
    }
  }
  return false;
}

function cellClicked(element) {
  const x = element.getAttribute("data-x");
  const y = element.getAttribute("data-y");
  console.log(`Clicked cell X ${x}, Y ${y}`);
  console.log(game.grid[x][y]);
  if(game.grid[x][y].validMove) {
    movePiece(x, y);
  } else if(game.grid[x][y].occupiedBy !== game.teamTurn || (game.grid[x][y].occupiedBy === "none" && !game.grid[x][y].validMove)) {
    return; // then we simply do nothing and return
  } else if(game.grid[x][y].active) { // If the clicked cell is active, we turn it inactive
    removeActive(x, y); // make it inactive
  } else if(!game.grid[x][y].active && game.grid[x][y].occupiedBy === game.teamTurn && !game.jumpMode && game.activeCell.length === 0 || (game.jumpMode && game.grid[x][y].jumpPossible && game.activeCell.length === 0)) { 
    setActive(x, y); // then we set this cell as active
  } else if(!game.grid[x][y].active && game.grid[x][y].occupiedBy === game.teamTurn && !game.jumpMode && game.activeCell.length > 0 || (game.jumpMode && game.grid[x][y].jumpPossible && game.activeCell.length > 0)) {
    a = game.activeCell[0];
    b = game.activeCell[1];
    removeActive(a, b); // then we remove active from the previously clicked cell
    setActive(x, y); // and set active on the currently clicked cell
  }
  if(game.activeCell.length > 0) {
    getValidMoves(x, y); // Single function to get valid moves whether we're jumping or moving to an empty cell. We'll put checks within the function to make sure if jump mode is enabled, we do not set empty cells as valid movements unless it requires a jump.
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

// If onlyCheck = true, we are simply looking for possible jumps then returning true or false. Otherwise, we are storing valid moves into an array and highlighting those cells.
function getValidMoves(x, y, onlyCheck) {
  if(game.teamTurn === "black") {
    const opponent = "red";
  } else {
    const opponent = "black";
  }
}

function movePiece(x, y) {
  let a = game.activeCell[0];
  let b = game.activeCell[1];
  clearCell(a, b); // Clear the active cell
  if(game.grid[x][y].jumpedCell !== 0) { // If a piece was jumped
    a = game.grid[x][y].jumpedCell[0];
    b = game.grid[x][y].jumpedCell[1];
    clearCell(a, b); // clear the jumped cell
    game.activeCell = [x, y]; // Sets the new activeCell to the cell we just landed on after jumping
    if(!checkForJumps(x, y, false)) { // Call the check for jumps function with false to check only the current cell for possible jumps. If there are no more jumps, we can set jump mode to false and end the turn further down.
      game.jumpMode = false;
    }
  }
  // Update the new cell that was moved to.
  game.grid[x][y].occupiedBy = game.teamTurn;
  game.grid[x][y].validMove = false;
  game.grid[x][y].jumpedCell = [];
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
  clearjumpPossibleArray();
}

// Takes each cell from the valid moves array and clears it/resets it to defaults. We can safely do this because only empty cells can become valid moves, meaning resetting to defaults won't erase anything important.
function clearValidMovesArray() {
  for(let i=0; i<game.validMoves; i++) {
    const x = game.validMoves[i][0];
    const y = game.validMoves[i][1];
    clearCell(x, y);
  }
}

// Takes each cell from the jumpPossible array and sets its jumpPossible property to false. We don't send them to clearCell() because we aren't setting all properties to default.
// We need to store cells in the jumpPossible array in the case that we have multiple possible jumps. Once we jump, we need to access all of the cells with the possibleJump property set to true and set them back to false.
function clearjumpPossibleArray() {
  for(let i=0; i<game.jumpPossible.length; i++) {
    const x = game.jumpPossible[i][0];
    const y = game.jumpPossible[i][1];
    game.grid[x][y].jumpPossible = false;
  }
}

function clearCell(x, y) {
  game.grid[x][y].validMove = false;
  game.grid[x][y].active = false;
  game.grid[x][y].jumpedCell = [];
  game.grid[x][y].element.classList.remove("highlight");
  game.grid[x][y].element.classList.remove("active");
  game.grid[x][y].occupiedBy = "none";
  game.grid[x][y].isKing = false;
  game.grid[x][y].jumpPossible = false;
  game.grid[x][y].element.style.backgroundImage = 'none';
}