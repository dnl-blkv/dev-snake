//  The MIT License (MIT)
//
//  Copyright (c) 2015 Daniil Belyakov
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.

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
// Dimensions of the snake field
var HEIGHT = 20;
var WIDTH = 40;

// Amount of frames per second also defining the snake moving speed
var FPS = 15;

// The frame length parameter used to determine the pause between frames
var FRAME_LENGTH = 1000 / FPS;

// Enumerated values describing directions of the snake movement
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
  // Array of coordinates of snake parts
  this.parts = [];

  // Size of the field in which the snake lives
  this.homeWidth = WIDTH;
  this.homeHeight = HEIGHT;

  // Direction of the snake
  this.direction = DIR.RIGHT;

  // Indicator of snake being stunned
  this.stunned = false;

  // ID of the last frame the snake was updated
  this.frameId = 0;

  // ID of the last frame the snake changed its directions
  this.lastDirectionChangeFrameId = 0;

  // Build the initial snake in the middle of its home
  var midY = (this.homeHeight / 2.0);
  var midX = (this.homeWidth / 2.0);
  addPart(this, midY, midX + 2.0);
  addPart(this, midY, midX + 1.0);
  addPart(this, midY, midX);
  addPart(this, midY, midX - 1.0);
  addPart(this, midY, midX - 2.0);

  // Add event listener for the snake movement
  addMovementListener(this);
}

// Adds an event listener for the snake movement; the listener responds to the
// key presses and updates the snake direction accordingly, but not more often
// than once per frame.
function addMovementListener (snake) {

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

// Add a new part with a given (y, x) location
function addPart (snake, y, x) {
  snake.parts.push({
    'y': y,
    'x': x
  });
}

function isAppleEatable (snake, apple) {
  var parts = snake.getParts();
  var head = parts[0];

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
  var parts = this.getParts();
  var tail = parts[parts.length - 1];

  if (isAppleEatable(this, apple)) {
    addPart(this, tail.y, tail.x);
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
  var partId;

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

// Draw the snake on a field
Snake.prototype.draw = function (field) {
  var text = field.getText();

  // Build a snake parts map
  var snakeParts = this.getParts();

  // If the old apple coordinate is negative then no apple has ever been spawned
  if (field.oldSnakeTail.x < 0) {
    // Full version of the method
    var partsMap = {};

    for (var partNum = 0; partNum < snakeParts.length; ++partNum) {
      var part = snakeParts[partNum];

      if (partsMap[part.y] === undefined) {
        partsMap[part.y] = [part.x];
      } else {
        partsMap[part.y].push(part.x);
      }
    }

    var partsMapKeys = Object.keys(partsMap);

    for (var partsMapKeyNum = 0; partsMapKeyNum < partsMapKeys.length; ++partsMapKeyNum) {
      // Corresponds to y coordinates of snake elements contained in a current line
      var y = partsMapKeys[partsMapKeyNum];

      // partsMapLines contains x coordinates of the snake elements
      var partsMapLine = partsMap[y];

      for (var charNum = 0; charNum < partsMapLine.length; ++charNum) {
        var x = partsMapLine[charNum];

        var partPosition = getTextPosition(field, y, x);
        text = text.substr(0, partPosition) + "@" + text.substr(partPosition + 1);
      }
    }
  } else {
    if ((field.oldSnakeTail.x !== snakeParts[snakeParts.length - 1].x) ||
        (field.oldSnakeTail.y !== snakeParts[snakeParts.length - 1].y)) {
      var oldTailPosition = getTextPosition(field, field.oldSnakeTail.y, field.oldSnakeTail.x);
      text = text.substr(0, oldTailPosition) + " " + text.substr(oldTailPosition + 1);
    }

    var newHeadPosition = getTextPosition(field, snakeParts[0].y, snakeParts[0].x);
    text = text.substr(0, newHeadPosition) + "@" + text.substr(newHeadPosition + 1);
  }

  // Save the new old snake tail coordinates
  field.oldSnakeTail.y = snakeParts[snakeParts.length - 1].y;
  field.oldSnakeTail.x = snakeParts[snakeParts.length - 1].x;

  // TODO: use getters/setters to access the properties of field
  field.text = text;
};

//==============================================================================
//============================FIELD CLASS DEFINITION============================
//==============================================================================
function Field () {
  this.width = WIDTH;
  this.height = HEIGHT;
  this.text = "";
  this.oldSnakeTail = {
    "x": -1,
    "y": -1
  };

  buildText(this);
}

Field.prototype.getWidth = function () {
  return this.width;
};

Field.prototype.getHeight = function () {
  return this.height;
};

Field.prototype.getText = function () {
  return this.text;
};

function buildText (field) {
  var i;
  var horizontalBorder = "";

  field.text = "";

  for (i = 0; i < (field.getWidth() + 2); ++ i) {
    horizontalBorder += "#";
  }

  field.text += horizontalBorder + '\n';

  var fieldLine = "#";

  for (i = 0; i < field.getWidth(); ++ i) {
    fieldLine += " ";
  }

  fieldLine += "#";

  for (i = 0; i < field.getHeight(); ++ i) {
    field.text += fieldLine + '\n';
  }

  field.text += horizontalBorder;
}

// Get text with snake and apple
Field.prototype.getFullText = function (snake, apple) {

  // Draw the snake
  snake.draw(this);

  var text = this.text;

  // Print the apple
  var applePosition = getTextPosition(this, apple.y, apple.x);
  text = text.substr(0, applePosition) + "$" + text.substr(applePosition + 1);

  this.text = text;

  return this.text;
};

function getTextPosition(field, y, x) {
  return (field.getWidth() + 3) * (y * 1 + 1) + x * 1 + 1;
}

//==============================================================================
//=============================GAME CLASS DEFINITION============================
//==============================================================================
function Game () {
  this.testMode = false;
  this.frameId = 0;
  this.score = 0;
  this.status = "Press SPACE to start";
  this.frameHeader = "";
  this.running = false;
  this.gameOver = false;
  this.field = new Field();
  this.snake = new Snake();
  this.apple = generateApple();
  updateFrameHeader(this);
}

Game.prototype.incrementFrameId = function () {
  ++this.frameId;
  if (this.testMode) {
    updateFrameHeader(this);
  }
};

Game.prototype.getFrameId = function () {
  return this.frameId;
};

Game.prototype.getScore = function () {
  return this.score;
};

Game.prototype.setStatus = function (status) {
  this.status = status;
  updateFrameHeader(this);
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
  updateFrameHeader(this);
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

function updateFrameHeader (game) {
  var frameHeader = "";

  frameHeader += "Game by Daniil Belyakov";

  for (var j = 0; j < HEIGHT; ++j) {
    frameHeader += "\n";
  }

  if (this.testMode) {
    frameHeader += "Frame: " + game.getFrameId();
    frameHeader += " | ";
  }

  frameHeader += "Score: " + game.getScore();
  frameHeader += " | " + game.getStatus();

  game.frameHeader = frameHeader;
}

function getFrameHeader (game) {
  return game.frameHeader;
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