//==============================================================================
//==================================UTILITIES===================================
//==============================================================================
var requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

var cancelAnimationFrame = window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame;

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUnixTimeMs () {
  var date = new Date();
  return date.getTime();
}

//==============================================================================
//==================================CONSTANTS===================================
//==============================================================================
var WIDTH = 40;
var HEIGHT = 20;
var FPS = 15;
var FRAME_LENGTH = 1000 / FPS;

var DIR = {
  'LEFT': 0,
  'UP': 1,
  'RIGHT': 2,
  'DOWN': 3
};

//==============================================================================
//============================SNAKE CLASS DEFINITION============================
//==============================================================================
function Snake () {
  this.parts = [];
  this.homeWidth = WIDTH;
  this.homeHeight = HEIGHT;
  this.direction = DIR.RIGHT;
  this.stunned = false;
  this.frameId = 0;
  this.lastDirectionChangeFrameId = 0;

  addPart(this, (this.homeWidth / 2.0) + 2.0, (this.homeHeight / 2.0));
  addPart(this, (this.homeWidth / 2.0) + 1.0, (this.homeHeight / 2.0));
  addPart(this, (this.homeWidth / 2.0), (this.homeHeight / 2.0));
  addPart(this, (this.homeWidth / 2.0) - 1.0, (this.homeHeight / 2.0));
  addPart(this, (this.homeWidth / 2.0) - 2.0, (this.homeHeight / 2.0));

  var snake = this;

  document.addEventListener("keydown", function(e){

    var oldDirection = snake.direction;

    if (snake.lastDirectionChangeFrameId < snake.frameId) {
      switch (e.keyCode) {
        case 37:
          if (snake.direction !== DIR.RIGHT) {
            snake.direction = DIR.LEFT;
          }
          break;
        case 38:
          if (snake.direction !== DIR.DOWN) {
            snake.direction = DIR.UP;
          }
          break;
        case 39:
          if (snake.direction !== DIR.LEFT) {
            snake.direction = DIR.RIGHT;
          }
          break;
        case 40:
          if (snake.direction !== DIR.UP) {
            snake.direction = DIR.DOWN;
          }
          break;
        default:
          break;
      }
    }

    if (oldDirection !== snake.direction) {
      snake.lastDirectionChangeFrameId = snake.frameId;
    }
  });
}

function addPart (snake, x, y) {
  snake.parts.push({
    'x': x,
    'y': y
  });
}

function isAppleEatable (snake, apple) {
  var head = snake.parts[0];

  return ((head.x === apple.x) && (head.y === apple.y));
}

function becomeStunned (snake) {
  snake.stunned = true;
}

Snake.prototype.blockDirectionChange = function () {
  this.lastDirectionChangeFrameId = this.frameId;
};

Snake.prototype.updateFrameId = function (frameId) {
  this.frameId = frameId;
};

Snake.prototype.isStunned = function () {
  return this.stunned;
};

Snake.prototype.eatApple = function (apple) {
  if (isAppleEatable(this, apple)) {
    addPart(this, apple.x, apple.y);
    return true;
  }

  return false;
};

Snake.prototype.getParts = function () {
  return this.parts;
};

Snake.prototype.getDirection = function () {
  return this.direction;
};

Snake.prototype.move = function () {
  var parts = this.getParts();
  var head = parts[0];
  var tail = parts[parts.length - 1];
  var oldTail = {
    'x': tail.x,
    'y': tail.y
  };
  var partId = 0;

  for (partId = (parts.length - 1); 0 < partId; --partId) {
    parts[partId].x = parts[partId - 1].x;
    parts[partId].y = parts[partId - 1].y;
  }

  // Update head
  switch (this.getDirection()) {
    case DIR.LEFT:
      head.x = (head.x - 1 + this.homeWidth) % this.homeWidth;
      break;
    case DIR.UP:
      head.y = (head.y - 1 + this.homeHeight) % this.homeHeight;
      break;
    case DIR.RIGHT:
      head.x = (head.x + 1 + this.homeWidth) % this.homeWidth;
      break;
    case DIR.DOWN:
      head.y = (head.y + 1 + this.homeHeight) % this.homeHeight;
      break;
    default:
      break;
  }

  for (partId = 1; partId < parts.length; ++partId) {
    if (((head.x === parts[partId].x) && (head.y === parts[partId]. y)) ||
        ((head.x === oldTail.x) && (head.y === oldTail.y))) {
      becomeStunned(this);
    }
  }
};

//==============================================================================
//============================FIELD CLASS DEFINITION============================
//==============================================================================
function Field () {
  this.lines = [];

  this.buildLines();
}

Field.prototype.getLines = function () {
  return this.lines;
};

Field.prototype.buildLines = function () {
  var i;
  var horizontalBorder = "";

  for (i = 0; i < (WIDTH + 2); ++ i) {
    horizontalBorder += "#";
  }

  this.lines.push(horizontalBorder + '\n');

  var fieldLine = "#";

  for (i = 0; i < WIDTH; ++ i) {
    fieldLine += " ";
  }

  fieldLine += "#";

  for (i = 0; i < HEIGHT; ++ i) {
    this.lines.push(fieldLine + '\n');
  }

  this.lines.push(horizontalBorder);
};

// Get text with snake and apple
Field.prototype.getFullText = function (snake, apple) {
  var linesWithSnake = [];
  var lines = this.getLines();

  var snakeParts = snake.getParts();
  var partsMap = {};

  for (var partNum = 0; partNum < snakeParts.length; ++ partNum) {
    var part = snakeParts[partNum];

    if (partsMap[part.y] === undefined) {
      partsMap[part.y] = [part.x];
    } else {
      partsMap[part.y].push(part.x);
    }
  }

  var lineArray;

  for (var lineNum = 0; lineNum < lines.length; ++lineNum) {
    var snakePositions = partsMap[lineNum - 1];
    var fieldLine = lines[lineNum];

    if (snakePositions === undefined) {
      linesWithSnake[lineNum] = fieldLine;
    } else {
      lineArray = fieldLine.split("");
      for (var charNum = 0; charNum < snakePositions.length; ++charNum) {
        lineArray[snakePositions[charNum] + 1] = "@";
      }
      linesWithSnake[lineNum] = lineArray.join("");
    }
  }

  lineArray = linesWithSnake[apple.y + 1].split("");
  lineArray[apple.x + 1] = "$";
  linesWithSnake[apple.y + 1] = lineArray.join("");

  return linesWithSnake.join("");
};

//==============================================================================
//=============================GAME CLASS DEFINITION============================
//==============================================================================
function Game () {
  this.testMode = false;
  this.frameId = 0;
  this.score = 0;
  this.status = "Press SPACE to start";
  this.running = false;
  this.gameOver = false;
  this.field = new Field();
  this.snake = new Snake();
  this.apple = generateApple();
}

Game.prototype.incrementFrameId = function () {
  ++this.frameId;
};

Game.prototype.getFrameId = function () {
  return this.frameId;
};

Game.prototype.getScore = function () {
  return this.score;
};

Game.prototype.setStatus = function (status) {
  this.status = status;
};

Game.prototype.getStatus = function () {
  return this.status;
};

Game.prototype.setRunning = function (running) {
  this.running = running;
};

Game.prototype.isRunning = function () {
  return this.running;
};

Game.prototype.setOver = function (gameOver) {
  this.gameOver = gameOver;
};

Game.prototype.isOver = function () {
  return this.gameOver;
};

Game.prototype.incrementScore = function () {
  ++this.score;
};

Game.prototype.getField = function () {
  return this.field;
};

Game.prototype.getSnake = function () {
  return this.snake;
};

Game.prototype.getApple = function () {
  return this.apple;
};

Game.prototype.dropApple = function () {
  this.apple = generateApple();
};

function generateApple () {
  return {
    'x': getRandomInt(0, WIDTH - 1),
    'y': getRandomInt(0, HEIGHT - 1)
  };
}

function getFrameHeader (game) {
  var frameHeader = "";

  for (var j = 0; j < HEIGHT; ++j) {
    frameHeader += '\n';
  }

  if (this.testMode) {
    frameHeader += "Frame: " + game.getFrameId();
    frameHeader += " | ";
  }

  frameHeader += "Score: " + game.getScore();
  frameHeader += " | " + game.getStatus();

  return frameHeader;
}

function printFrameHeader (game) {
  var frameHeader = getFrameHeader(game);
  console.log(frameHeader);
}

function drawField (game) {
  var field = game.getField();
  var snake = game.getSnake();
  var apple = game.getApple();
  var fieldText = field.getFullText(snake, apple);
  console.log(fieldText);
}

Game.prototype.draw = function () {
  printFrameHeader(this);

  drawField(this);
};

//==============================================================================
//=====================================GAME=====================================
//==============================================================================
var game = new Game();
var timerId = 0;
var oldTime, newTime;
oldTime = getUnixTimeMs();

function reset () {
  game = new Game();
  timerId = 0;
  oldTime = 0;
  newTime = 0;
}

function tick (timestamp) {
  var snake = game.getSnake();
  var apple = game.getApple();

  newTime = getUnixTimeMs();

  if (newTime - oldTime >= FRAME_LENGTH) {
    // Move the snake and eat the apple
    snake.move();
    if (snake.eatApple(apple)) {
      game.incrementScore();
      game.dropApple();
    }

    if (snake.isStunned()) {
      game.setStatus("Game Over! | Press ENTER to reset");
      game.setRunning(false);
      game.setOver(true);
      // Draw the frame
      game.draw();
      stop();
    } else {

      // Draw the frame
      game.draw();

      // Increase the frame counter
      game.incrementFrameId();
      var frameId = game.getFrameId();
      snake.updateFrameId(frameId);
      if (frameId % 200 === 0) {
        // Clear the console every N frames
        console.clear();
        game.draw();
      }
    }

    oldTime = getUnixTimeMs();
  }

  if (game.isRunning()) {
    timerId = requestAnimationFrame(tick);
  } else {
    cancelAnimationFrame(timerId);
  }
}

function stop () {
  cancelAnimationFrame(timerId);
  game.setRunning(false);
}

function run () {
  timerId = requestAnimationFrame(tick);
  game.setStatus("Running | Press SPACE to pause");
  game.setRunning(true);
}

game.draw();

document.addEventListener("keydown", function(e){

  switch (e.keyCode) {
    case 13:
      if (game.isOver()) {
        reset();
        game.draw();
      }
      break;
    case 32:
      if (!game.isOver()) {
        if (game.isRunning()) {
          var snake = game.getSnake();
          snake.blockDirectionChange();
          game.setStatus("Paused | Press SPACE to continue");
          game.draw();
          stop();
        } else {
          run();
        }
      }
      break;
    default:
      break;
  }
});