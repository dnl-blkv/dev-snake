//==============================================================================
//==================================CONSTANTS===================================
//==============================================================================
var WIDTH = 40;
var HEIGHT = 20;

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
//=====================================GAME=====================================
//==============================================================================

var testMode = false;
var frameId = 0;
var score = 0;
var status = "Press SPACE to start";
var running = false;
var gameOver = false;

function printFrameHeader () {
  var frameHeader = "";

  for (var j = 0; j < HEIGHT; ++j) {
    frameHeader += '\n';
  }

  if (testMode) {
    frameHeader += "Frame: " + frameId;
    frameHeader += " | ";
  }

  frameHeader += "Score: " + score;
  frameHeader += " | " + status;

  console.log(frameHeader);
}

var field = new Field();

var snake = new Snake();

var apple = generateApple();

var timerId = 0;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateApple () {
  return {
    'x': getRandomInt(0, WIDTH - 1),
    'y': getRandomInt(0, HEIGHT - 1)
  };
}

function drawField () {
  var fieldText = field.getFullText(snake, apple);
  console.log(fieldText);
}

function draw () {

  printFrameHeader();

  drawField();
}

drawField();

function tick () {
  // Move the snake and eat the apple
  snake.move();
  if (snake.eatApple(apple)) {
    ++score;
    apple = generateApple()
  }

  if (snake.isStunned()) {
    stop();
    status = "Game Over!";
    running = false;
    gameOver = true;
    // Draw the frame
    draw();
  } else {

    // Draw the frame
    draw();

    // Increase the frame counter
    ++frameId;
    snake.updateFrameId(frameId);
    if (frameId % 200 === 0) {
      // Clear the console every N frames
      console.clear();
      draw();
    }
  }
}

function stop () {
  clearInterval(timerId);
}

function run () {
  timerId = setInterval(tick, 100);
  status = "Running";
  running = true;
}

draw();

document.addEventListener("keydown", function(e){

  switch (e.keyCode) {
    case 32:
        if (!gameOver) {
          if (!running) {
            run();
          } else {
            snake.blockDirectionChange();
            status = "Paused";
            running = false;
            draw();
            stop();
          }
        }
      break;
    default:
      break;
  }
});