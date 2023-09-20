const game = {
  rows: 8,
  columns: 8,
  redStartingPositions: [[0, 0], [2, 0], [4, 0], [6, 0], [1, 1], [3, 1], [5, 1], [7, 1], [0, 2], [2, 2], [4, 2], [6, 2]],
blackStartingPositions: [[1, 7], [3, 7], [5, 7], [7, 7], [0, 6], [2, 6], [4, 6], [6, 6], [1, 5], [3, 5], [5, 5], [7, 5]],
  grid:[],
  teamTurn: "black",
  activeCell: [],
  validMoves: [],
  activeMode: false, // When a cell is clicked and possible moves are displayed, this is considered active mode and limits what can be clicked.
}

window.onload = function() {
  let cycleClass = 0; // Used to color every other cell a different color.
  let cssClass; // Used to set the color of each cell.
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
        element:elem, // Stores a reference to it's respective DIV element for easier manipulation later.
        active: false, // For second click functionality. If this cell is active, we can click it again to make it inactive.
        validMove: false,
        jumpedCell:[], // Holds the coordinates to 
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

function cellClicked(element) {
  const x = element.getAttribute("data-x");
  const y = element.getAttribute("data-y");
  if(game.grid[x][y].active) {
    removeActive(x, y);
  } else if(!game.grid[x][y].active && game.grid[x][y].occupiedBy === game.teamTurn && !game.activeMode) {
    setActive(x, y);
  } else if(!game.grid[x][y].active && game.grid[x][y].occupiedBy === game.teamTurn && game.activeMode) {
    a = game.activeCell[0];
    b = game.activeCell[1];
    removeActive(a, b);
    setActive(x, y);
  } else if(game.grid[x][y].occupiedBy !== game.teamTurn || (game.grid[x][y].occupiedBy === "none" && !game.grid[x][y].validMove)) {
    return;
  } else if(game.grid[x][y].validMove) {
    // move piece;
    return;
  }
}

function removeActive(x, y) {
  console.log("called remove active");
  game.grid[x][y].active = false;
  game.grid[x][y].element.classList.remove("active");
  game.activeCell = [];
  game.activeMode = false;
  clearValidMovesArray();
}

function setActive(x, y) {
  console.log("called setActive");
  game.grid[x][y].active = true;
  game.grid[x][y].element.classList.add("active");
  game.activeCell = [x, y];
  findValidMoves(x, y);
  game.activeMode = true;
}

function findValidMoves(x, y) {
  let modifier;
  let opponent;
  // Sets a modifier so when we add the modifier to the row we get the desired effect of moving either up or down depending on which team's piece we're moving.
  if(game.teamTurn === "red") {
    modifier = 1;
    opponent = "black";
  } else if(game.teamTurn === "black") {
    modifier = -1;
    opponent = "red";
  }
  // start checking directions for empty cells or enemy pieces
}

function clearValidMovesArray() {
  for(let i=0; i<game.validMoves; i++) {
    const x = validMoves[i][0];
    const y = validMoves[i][1];
    game.grid[x][y].validMove = false;
    game.grid[x][y].jumpedCell = [];
    game.grid[x][y].cssList.remove("highlight");
  }
}