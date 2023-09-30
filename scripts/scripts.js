const MAX_ROWS = 8;
const MAX_COLS = 8;
const RED_START = [[0, 0], [2, 0], [4, 0], [6, 0], [1, 1], [3, 1], [5, 1], [7, 1], [0, 2], [2, 2], [4, 2], [6, 2]];
const BLACK_START = [[1, 7], [3, 7], [5, 7], [7, 7], [0, 6], [2, 6], [4, 6], [6, 6], [1, 5], [3, 5], [5, 5], [7, 5]];
const STARTING_TEAM = "black";
const DEFAULT_STYLE1 = "colorOne";
const DEFAULT_STYLE2 = "colorTwo";

class Game {
  constructor() {
    this.rows = MAX_ROWS;
    this.columns = MAX_COLS;
    this.redStartingPositions = RED_START;
    this.blackStartingPositions = BLACK_START;
    this.teamTurn = STARTING_TEAM;
    this.activeCell = [];
    this.validMoves = [];
    this.jumpMode = false; // When a possible jump is found, we set this to true to force a player to only select pieces that can jump the opponent.
    this.piecesThatCanJump = [];
    this.style1 = DEFAULT_STYLE1;
    this.style2 = DEFAULT_STYLE2;
  }
}

class Cell {
    constructor(element) {
      this.occupiedBy = "none", // Which teams piece occupies this cell
      this.isKing = false; // Is the piece occupying this cell a king?
      this.element = element; // A reference to the DOM element this object represents
      this.active = false; // Is this cell active or not
      this.validMove = false; // Is it valid to move to this cell from the active cell
      this.jumpRequired = []; // The jump required to get from the active cell to this cell.
      this.jumpPossible = false; // Whether or not a jump is possible FROM this cell.
      this.bgImage = null; // Used to update cells to display pieces as we move.
      const x = parseInt(element.getAttribute("data-x"));
      const y = parseInt(element.getAttribute("data-y"));
      // Remove any added styling to the respective DOM element
      element.style.backgroundImage = "none";
      element.classList.remove(...element.classList); // Remove all added css styles
      // Set default styling
      if ((x + y) % 2 === 0) {
        element.classList.add(game.style2);
      } else {
        element.classList.add(game.style1);
      }
    }
}

class Grid {
  constructor() {
    this.cell = [];
    this.generateGrid();
  }

  generateGrid() {
    for (let y = 0; y < game.rows; y++) {
      for (let x = 0; x < game.columns; x++) {
        if(y === 0) {
          this.cell.push([]); // Initializes the columns. While y is 0, we are iterating through the columns for the first time, so we need to create them.
        }
        const element = document.querySelector(`[data-x="${x}"][data-y="${y}"]`); // Grab the respective DOM element
        this.cell[x][y] = new Cell(element); // Create a new cell in this index and send the respective DOM element as a parameter so it can hold it as a reference
      }
    }
  }
}

let game = new Game();
let grid;

// DOM generation
window.onload = function() {
  for(let y=0; y<game.rows; y++) {
    for(let x=0; x<game.columns; x++) {
      const container = document.getElementById('container');
      const elem = document.createElement('div');
      container.appendChild(elem);
      elem.setAttribute('data-x', x);
      elem.setAttribute('data-y', y);
      elem.setAttribute('onClick','cellClicked(this)');
      elem.className = "cell";
    }
  }
  grid = new Grid();
  spawnPieces();
}

function spawnPieces() {
  const teamColors = ["black", "red"]; // Sets an array holding each team color.
  const element = document.getElementById("turn-display");
  for(const color of teamColors) { // For each index in teamColors, sets the variable color to that indexes value
    const startingPositions = color === "black" ? game.blackStartingPositions : game.redStartingPositions; // Ternary if statement. 
    for(let i=0; i<startingPositions.length; i++) {
      let x = startingPositions[i][0];
      let y = startingPositions[i][1];
      grid.cell[x][y].occupiedBy = color;
      grid.cell[x][y].element.style.backgroundImage = `url(${color}Piece.png)`;
      grid.cell[x][y].bgImage = `url(${color}Piece.png)`; // Used to update cells as we move.
    }
  }
  element.style.backgroundImage = "URL(blackPieceMini.png)";
}

function startTurn() {
  element = document.getElementById("turn-display");
  game.teamTurn = (game.teamTurn === "black") ? "red" : "black"; // If game.teamTurn is black, set it to red, otherwise set it to black.
  const teamColor = game.teamTurn;
  element.style.backgroundImage = `URL(${teamColor}PieceMini.png)`;
  checkForJumps(null, null, true)// Checks if any jumps are available to the current player and if they are found, turns jumpMode on, forcing the player to jump.
}

// Used to check for possible jumps. Not the same function that sets these jumps as valid movements. This is used at the beginning of each turn to force jumps if they are available by enabling jump mode.
function checkForJumps(a, b, checkAll) {
  // If check all is true, we check all pieces of the current team to see if they can make a jump.
  if(checkAll) {
    for(let y=0; y<game.rows; y++) {
      for(let x=0; x<game.columns; x++){
        if(grid.cell[x][y].occupiedBy === game.teamTurn) {
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
  const cell = grid.cell[x][y];
  console.log(`Clicked cell X ${x}, Y ${y}`);
  console.log(grid.cell[x][y]);
  if(cell.validMove) {
    movePiece(x, y);
  } else if(cell.active) { // If the clicked cell is active, we turn it inactive
    toggleActive(x, y, false); // make it inactive
  } else if(!cell.active && cell.occupiedBy === game.teamTurn && game.activeCell.length === 0 && (!game.jumpMode || game.jumpMode && cell.jumpPossible)) { 
    toggleActive(x, y, true);
  } else if(!cell.active && cell.occupiedBy === game.teamTurn && game.activeCell.length > 0 && (!game.jumpMode || game.jumpMode && cell.jumpPossible)) {
    a = game.activeCell[0];
    b = game.activeCell[1];
    toggleActive(a, b, false); // then we remove active from the previously clicked cell
    toggleActive(x, y, true); // and set active on the currently clicked cell
  }
}

function toggleActive(x, y, toggle) {
  const cell = grid.cell[x][y];
  cell.active = toggle;
  if(toggle) {
    cell.element.classList.add("active");
    game.activeCell = [x, y];
    getValidMoves(x, y);
  } else {
    cell.element.classList.remove("active");
    game.activeCell = [];
    clearValidMovesArray();
  }
}

function getValidMoves(x, y, onlyCheck) {
  const cell = grid.cell[x][y];
  if(game.teamTurn === "red" || cell.isKing) {
    // Check down-left
    checkDirection(x, y, -1, 1, onlyCheck);
    // Check down-right
    checkDirection(x, y, 1, 1, onlyCheck);
  }
  if(game.teamTurn === "black" || cell.isKing) {
    // Check up-left
    checkDirection(x, y, -1, -1, onlyCheck);
    // Check up-right
    checkDirection(x, y, 1, -1, onlyCheck);
  }
}

// x and y are the coordinates to start checks from, dx and dy are the adjustments for the x and y coords to determine which direction to check, the next two are for edge checking and then onlyCheck is whether we're only checking for jumps.
function checkDirection(x, y, dx, dy, onlyCheck) {
  let a;
  let b;
  const opponent = (game.teamTurn === "black") ? "red" : "black"; // If game.teamTurn === black, return red, else return black.
  if(isInGrid(x+dx, y+dy) && !game.jumpMode && !onlyCheck && grid.cell[x+dx][y+dy].occupiedBy === "none") { // Checks if the next cell over in the given direction is a valid cell inside of the grid and is empty, as long as jump mode is disabled.
    setValidMove(x+dx, y+dy);
  } else if(isInGrid(x+dx, y+dy) && grid.cell[x+dx][y+dy].occupiedBy === opponent) { // If jump mode is enabled, it instead first checks that the next cell over in the given direction is valid and inside of the grid then checks if the cell contains an opponent piece.
    a = x+dx; // For prettier calculations. Since an opponent was found we set the cell's x coordinate to variable a.
    b = y+dy; // For prettier calculations. Since an opponent was found we set the cell's y coordinate to variable y.
    if(isInGrid(a+dx, b+dy) && grid.cell[a+dx][b+dy].occupiedBy === "none") { // Now, starting at this new cell location (the one in which the opponent piece was discovered), we check the next cell over in the given direction for being a valid cell inside of the grid and for being empty.
      if(onlyCheck && !grid.cell[x][y].jumpPossible) { // If we are in jump only mode and we haven't already marked the as having a possible jump, we
        setJumpPossible(x, y); // set the location as having a possible jump
      } else if(!onlyCheck) { // Otherwise if we are not in check only mode, we 
        setValidMove(a+dx, b+dy); // set the empty cell we just checked as being a valid move
        grid.cell[a+dx][b+dy].jumpRequired = [a, b]; // Sets the coordinates of the cell that must be jumped before landing on this new valid move cell.
      }
    }
  }

  // Helper function to check if the cell in question is valid and inside of the grid. Basically just edge checking.
  function isInGrid(x, y) {
    return x >= 0 && x < game.columns && y >= 0 && y < game.rows;
  }
}

function setJumpPossible(x, y) {
  grid.cell[x][y].jumpPossible = true;
  game.piecesThatCanJump.push([x,y]);
}

function setValidMove(x, y) {
  console.log(`set valid move called for cell ${x},${y}`);
  const cell = grid.cell[x][y];
  cell.validMove = true;
  cell.element.classList.add("highlight");
  game.validMoves.push([x,y]);
}

function movePiece(x, y) {
  clearPiecesThatCanJumpArray(); // Clear any cells that previously had the marker saying they can jump another piece since the only additional jump allowed is from the piece that just jumped
  const cell = grid.cell[x][y];
  game.piecesThatCanJump = []; // Clear the array itself.
  let a = game.activeCell[0]; // Store active piece's column coordinate
  let b = game.activeCell[1]; // Store active piece's row coordinate
  const bgImage = grid.cell[a][b].bgImage; // Store the background image from the cell we're leaving
  cell.isKing = grid.cell[a][b].isKing; // Transfer King status to the new cell we're moving to in case we need to check for double jumps from that location.
  clearCell(a, b); // Clear the cell we're leaving
  if(cell.jumpRequired.length !== 0) { // If a piece was jumped
    a = cell.jumpRequired[0];
    b = cell.jumpRequired[1];
    clearCell(a, b); // clear the jumped cell
    checkForJumps(x, y, false) // then call the check for jumps function with false to check only the current cell for possible additional jumps. If there are no more jumps, we can set jump mode to false and end the turn further down.
    if(game.jumpMode) {
      clearValidMovesArray(); // If we remain in jump mode, endTurn won't be triggered and thus highlighted cells will not be cleared, so we call it here.
    }
  }
  // Update the new cell that was moved to.
  cell.occupiedBy = game.teamTurn;
  cell.validMove = false;
  cell.jumpRequired = [];
  cell.bgImage = bgImage;
  cell.element.style.backgroundImage = bgImage;
  if(game.teamTurn === "red" && y === 7 || game.teamTurn === "black" && y === 0) {
    kingMaker(x, y);
  }
  if(!game.jumpMode) { // End turn only if no more jumps are available.
    endTurn();
  }
}

function kingMaker(x, y) {
  cell = grid.cell[x][y];
  cell.isKing = true;
  const teamColor = cell.occupiedBy;
  cell.element.style.backgroundImage = `url(${teamColor}KingPiece.png)`;
  cell.bgImage = `url(${teamColor}KingPiece.png)`;
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
  for(const move of game.validMoves) {
    const x = move[0];
    const y = move[1];
    const cell = grid.cell[x][y];
    cell.element.classList.remove("highlight");
    cell.validMove = false;
    cell.jumpRequired = [];
  }
  game.validMoves = [];
}

// Takes each cell from the jumpPossible array and sets its jumpPossible property to false. We don't send them to clearCell() because we aren't setting all properties to default.
// We need to store cells in the jumpPossible array in the case that we have multiple possible jumps. Once we jump, we need to access all of the cells with the possibleJump property set to true and set them back to false.
function clearPiecesThatCanJumpArray() {
  for(const piece of game.piecesThatCanJump) {
    const x = piece[0];
    const y = piece[1];
    grid.cell[x][y].jumpPossible = false;
  }
}

function clearCell(x, y) {
  const elem = grid.cell[x][y].element; // Store a temporary reference to the DOM element
  grid.cell[x][y] = new Cell(elem); // Set the grid object back to default values
}

// Single function for removing any added styles to DOM elements. This is in case I want to add any later; removing them all at once will be easier if I only need to edit this function.
function clearElement(elem) {
  elem.classList.remove("highlight"); // Remove the valid move highlight if it exists
  elem.classList.remove("active"); // Remove any active highlighting if it exists
}

function resetGame() {
  game = new Game();
  grid = new Grid();
  spawnPieces(); // Respawn all of the pieces in their proper location.
  game.teamTurn = "red"; // We set turn to red just so that when we call startTurn it flips back to black, which always starts first.
  startTurn();
  // will have to clear score tracking as well here
}