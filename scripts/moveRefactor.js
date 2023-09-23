// use tenerary conditional in the start turn section to replace if statement that switches the teamTurn variable

/* 
example call for bottom left:

if(game.teamTurn === "red" || game.grid[x][y].isKing) {
  checkDirection(x, y, -1, 1, 0, 7, onlyCheck);
}


*/

function getValidMoves(x, y, onlyCheck) {
  if(game.teamTurn === "black" || game.grid[x][y].isKing) {
    // Check down-left
    checkDirection(x, y, -1, 1, 0, 7, onlyCheck);
    // Check down-right
    checkDirection(x, y, 1, 1, 7, 7, onlyCheck);
  }
  if(game.teamturn === "red" || game.grid[x][y].isKing) {
    // Check up-left
    checkDirection(x, y, -1, -1, 0, 0, onlyCheck);
    // Check up-right
    checkDirection(x, y, 1, -1, 7, 0, onlyCheck);
  }
}

// x and y are the coordinates to start checks from, dx and dy are the adjustments for the x and y coords to determine which direction to check, the next two are for edge checking and then onlyCheck is whether we're only checking for jumps.
function checkDirection(x, y, dx, dy, columnCheck, rowCheck, onlyCheck) {
let a;
let b;
const opponent = (game.teamTurn === "black") ? "red" : "black"; // If game.teamTurn === black, return red, else return black.
  if(x !== columnCheck && y !== rowCheck && !game.jumpMode && !onlyCheck && game.grid[x+dx][y+dy].occupiedBy === "none") {
    setValidMove(x+dx, y+dy);
  } else if(game.grid[x+dx][y+dy].occupiedBy === opponent) {
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