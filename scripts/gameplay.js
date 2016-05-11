Breakout.screens['game-play'] = (function(game, input, graphics, settings, highscore) {
	'use strict';

	function PlayerPaddle(spec) {
		var that = {
			get x() { return spec.x; },
			get y() { return spec.y; },
			get w() { return spec.w; },
			get h() { return spec.h; },
			get s() { return spec.s; }
		};

		that.shrink = function() {
			spec.w = spec.w / 2;
			spec.x += spec.w / 2;
		}

		that.moveLeft = function(timePassed, leftBound) {
			spec.x -= spec.s * (timePassed / 1000);

			if(paddleLoc.x < leftBound) {
				spec.x = leftBound;
			}
		};

		that.moveRight = function(timePassed, rightBound) {
			spec.x += spec.s * (timePassed / 1000);

			if(paddleLoc.x + spec.w > rightBound) {
				spec.x = rightBound - spec.w;
			}
		};

		return that;
	}

	function Ball(spec) {
		var that = {
			get x() { return spec.x; },
			get y() { return spec.y; },
			get r() { return spec.r; },
			get v() {
				return {
					get spd() { return spec.v.spd; },
					get angle() { return spec.v.angle; }
				};
			},
			get speedUps() { return spec.speedUps; }
		};

		//function that updates the ball's movement
		that.update = function(timePassed) {
			spec.x += spec.v.spd * Math.cos(spec.v.angle) * timePassed / 1000;
			spec.y -= spec.v.spd * Math.sin(spec.v.angle) * timePassed / 1000;
		};

		that.setLocation = function(loc) {
			spec.x = loc.x;
			spec.y = loc.y;
		}

		that.increaseSpeed = function(amt) {
			spec.v.spd += amt;
			spec.speedUps++;
		};

		//function that gives you where the ball will be when it moves (useful for collision detection)
		that.movePreview = function(timePassed) {
			return {
				x: spec.x + spec.v.spd * Math.cos(spec.v.angle) * timePassed / 1000,
				y: spec.y - spec.v.spd * Math.sin(spec.v.angle) * timePassed / 1000,
				r: spec.r
			};
		};

		//functions for changing the ball angle (first 2 just reflect across a major axis velocity-wise)
		that.reflectVelX = function() {
			spec.v.angle = Math.PI - spec.v.angle;
			spec.v.angle = spec.v.angle % (2 * Math.PI);
		};

		that.reflectVelY = function() {
			spec.v.angle = - Math.PI * 2 - spec.v.angle;
			spec.v.angle = spec.v.angle % (2 * Math.PI);
		};

		that.setVelAngle = function(angle) {
			spec.v.angle = angle;
			spec.v.angle = spec.v.angle % (2 * Math.PI);
		};

		return that;
	}

	function Brick(spec) {
		var that = {
			get x() { return spec.x; },
			get y() { return spec.y; },
			get w() { return spec.w; },
			get h() { return spec.h; },

			get points() { return spec.points; },

			get intact() { return spec.intact; }
		};

		that.destroy = function() {
			spec.intact = false;
		}

		return that;
	}

	//function to compute collision between a circle and a rectangle
	//taken from http://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle-in-html5-canvas
	function collides (rect, circle) {
		// compute a center-to-center vector
		var half = { x: rect.w/2, y: rect.h/2 };
		var center = {
			x: circle.x - (rect.x+half.x),
			y: circle.y - (rect.y+half.y)
		};

		// check circle position inside the rectangle quadrant
		var side = {
			x: Math.abs (center.x) - half.x,
			y: Math.abs (center.y) - half.y
		};

		if (side.x >  circle.r || side.y >  circle.r) // outside
			return false;
		if (side.x < 0 || side.y < 0) // intersects side or corner
			return true;

		// circle is near the corner
		return side.x*side.x + side.y*side.y  < circle.r*circle.r;
	}

	//functions for keyboard to invoke
	function movePlayerLeft(timePassed) {
		paddleLoc.moveLeft(timePassed, 0);
	}

	function movePlayerRight(timePassed) {
		paddleLoc.moveRight(timePassed, 1000);
	}

	function quitBreakout() {
		running = false;
		keyboard.deregisterCommand(movePlayerRight);
		keyboard.deregisterCommand(movePlayerLeft);
		keyboard.deregisterCommand(quitBreakout);
		window.cancelAnimationFrame(currentFrame);
		if(!gameOver) {
			game.showScreen('main-menu');
		}
		else {
			game.showScreen('high-score');
		}
	}

	//used for input
	var keyboard = input.Keyboard();

	var running = true;
	var gameOver = false;

	//keep track of countdown
	var countdown;

	//keep track of non-object game info
	var lives;
	var points;

	//keep track of game objects
	var paddleLoc;
	var balls;
	var bricks;
	var bricksDestroyed;

	//keep track of score-based game info
	var rowsCleared;
	var newBallPoints;
	var speedUps;
	var shrunk = false;

	//timestamp and frame information
	var prevTime;
	var currentTime;
	var currentFrame = undefined;

	//core loop: take time, update, render, repeat
	function gameLoop() {
		prevTime = currentTime;
		currentTime = performance.now();

		keyboard.update(currentTime - prevTime);

		if(!gameOver) {
			for(var i = 0; i < 4; i++) {  //we update game state 4 times per frame (so if we can maintain 60 fps we have 240 state updates per second)
				update((currentTime - prevTime) / 4);
			}
		}

		//then update particles (done independently of game update so that they can move even on the game over screen)
		graphics.updateParticles(currentTime - prevTime);

		render();

		if(running) {
			currentFrame = window.requestAnimationFrame(gameLoop);
		}
	}

	//updates the game state
	function update(timePassed) {
		//if we're in the countdown just decrease countdown time, move ball to paddle, and return
		if(countdown > 0) {
			countdown -= timePassed / 1000;
			balls[0].setLocation({x:paddleLoc.x + paddleLoc.w / 2, y:paddleLoc.y - balls[0].r});
			return;
		}

		//first determine if the player has been shrunk yet, if he hasn't determine if he should, and do so.
		if(!shrunk) {
			for(var i = 0; i < bricks[0].length; i++) {
				if(!bricks[0][i].intact) {
					shrunk = true;
					paddleLoc.shrink();
					break;
				}
			}
		}

		//For every ball currently in the game we check for collisions
		for(var ball = balls.length - 1; ball >= 0; ball--) {
			//speed up the ball if it hasn't been sped up yet
			while(balls[ball].speedUps < speedUps) {
				balls[ball].increaseSpeed(60);
			}

			//create preview object for collision detection
			var ballPreview = balls[ball].movePreview(timePassed);

			//if we do detect a collision change ball angle and create a new preview

			//detect paddle collision (done first so that the player has a chance to redirect the ball before it hits the floor)
			if(collides(paddleLoc, ballPreview)) {
				//see if ball was above the paddle in previous frame
				//if so compute dynamic launch angle (for aiming)
				if(balls[ball].x + balls[ball].r > paddleLoc.x && balls[ball].x - balls[ball].r < paddleLoc.x + paddleLoc.w) {
					var step = ballPreview.x - ballPreview.r - paddleLoc.x;
					var totalLeft = Math.PI * 3 / 4;

					balls[ball].setVelAngle(totalLeft - step / paddleLoc.w * totalLeft);
					ballPreview = balls[ball].movePreview(timePassed);
				}
				else {  //otherwise reflect on x axis
					balls[ball].reflectVelX();
					ballPreview = balls[ball].movePreview(timePassed);
				}
			}

			//brick collision
			//first determine if the ball is even in the area that the bricks are in, if so check rows/bricks/etc., otherwise skip
			if(collides({x:bricks[0][0].x, y:bricks[0][0].y, w:bricks[0][0].w * bricks[0].length, h:bricks[0][0].h * bricks.length}, ballPreview)) {
				//then iterate through the rows of bricks
				for(var row = bricks.length - 1; row >= 0; row--) {
					//check to see if the row is cleared yet, if so then check if the ball is even within the row, if so check bricks on row, otherwise skip
					if(!rowsCleared[row] && collides({x:bricks[row][0].x, y:bricks[row].y, w:bricks[row][0].w * bricks[row].length, h:bricks[row][0].h}, ballPreview)) {
						//then iterate through the bricks
						for(var brick = 0; brick < bricks[row].length; brick++) {
							//then finally check the individual bricks to see if the ball has hit them, if so destroy the brick, award points, and redirect the ball
							if(bricks[row][brick].intact && collides(bricks[row][brick], ballPreview)) {
								bricks[row][brick].destroy();
								points += bricks[row][brick].points;
								newBallPoints += bricks[row][brick].points;  //also keep track of how many points until next ball is spawned
								bricksDestroyed++;

								//spawn particles as well
								for(var particle = 0; particle < 15; particle++) {
									graphics.spawnParticle({
										x:bricks[row][brick].x + bricks[row][brick].w / 2,
										y:bricks[row][brick].y + bricks[row][brick].h / 2
									});
								}

								var hitSides = balls[ball].y > bricks[row][brick].y && balls[ball].y < bricks[row][brick].y + bricks[row][brick].h;
								var hitTopBot = balls[ball].x + balls[ball].r * 2 / 3 > bricks[row][brick].x && balls[ball].x - balls[ball].r * 2 / 3 < bricks[row][brick].x + bricks[row][brick].w  //purposefully made hitTopBot easier to achieve to avoid corner hit glitch
								
								if((hitSides && hitTopBot) || (!hitSides && !hitTopBot)) {
									balls[ball].reflectVelX();
									balls[ball].reflectVelY();
								}
								else if(hitSides) {
									balls[ball].reflectVelX();
								}
								else if(hitTopBot){
									balls[ball].reflectVelY();
								}

								ballPreview = balls[ball].movePreview(timePassed);
							}
						}
					}
				}
			}
			
			//wall collision
			if(ballPreview.x - ballPreview.r < 0 || ballPreview.x + ballPreview.r > 1000) {
				balls[ball].reflectVelX();
				ballPreview = balls[ball].movePreview(timePassed);
			}
			//ceiling collision
			if(ballPreview.y - ballPreview.r < 0) {
				balls[ball].reflectVelY();
				ballPreview = balls[ball].movePreview(timePassed);
			}
			//floor collision
			if(ballPreview.y + ballPreview.r > 900) {
				//spawn Particles
				for(particle = 0; particle < 30; particle++) {
					graphics.spawnParticleUp({x:balls[ball].x, y:balls[ball].y});
				}
				balls.splice(ball, 1);
				continue;
			}

			balls[ball].update(timePassed);
		}

		if(speedUps < 1 && bricksDestroyed >= 4) {
			speedUps = 1;
		}
		if(speedUps < 2 && bricksDestroyed >= 12) {
			speedUps = 2;
		}
		if(speedUps < 3 && bricksDestroyed >= 36) {
			speedUps = 3;
		}
		if(speedUps < 4 && bricksDestroyed >= 62) {
			speedUps = 4;
		}

		for(var i = 0; i < rowsCleared.length; i++) {
			if(!rowsCleared[i]) {
				var cleared = true;

				for(var j = 0; j < bricks[i].length; j++) {
					if(bricks[i][j].intact) {
						cleared = false;
						break;
					}
				}

				if(cleared) {
					rowsCleared[i] = true;
					points += 25;
					newBallPoints += 25;
				}
			}
		}

		if(newBallPoints >= 100) {
			newBallPoints -= 100;

			balls.push(Ball({
				x: paddleLoc.x + paddleLoc.w / 2,
				y: paddleLoc.y - 17,
				r: 15,
				v: {
					spd: 550,
					angle: Math.PI / 4
				},
				speedUps: 0
			}));
		}

		//if you run out of balls subtract a life
		if(balls.length == 0 && !gameOver) {
			lives--;

			if(lives > 0) {  //if lives is greater than 0 after subtraction add another ball to get started again
				balls.push(Ball({
					x: paddleLoc.x + paddleLoc.w / 2,
					y: paddleLoc.y - 17,
					r: 15,
					v: {
						spd: 550,
						angle: Math.PI / 4
					},
					speedUps: 0
				}));

				countdown = 3;
			}
		}

		if(lives <= 0 && !gameOver) {
			gameOver = true;
			lives = 0;
			highscore.addScore(points);

			//spawn particles in remaining bricks
			for(row = 0; row < bricks.length; row++) {
				for(brick = 0; brick < bricks[row].length; brick++) {
					if(bricks[row][brick].intact) {
						for(particle = 0; particle < 15; particle++) {
							graphics.spawnParticle({
								x:bricks[row][brick].x + bricks[row][brick].w / 2, 
								y:bricks[row][brick].y + bricks[row][brick].h / 2
							});
						}
					}
				}
			}

			//spawn particles in paddle
			for(var i = 0; i < 200; i++) {
				graphics.spawnParticleUp({
					x:paddleLoc.x + Math.random() * paddleLoc.w,
					y:paddleLoc.y + paddleLoc.h / 2
				});
			}
		}
	}

	function render() {
		graphics.clear();

		//draw the particles
		graphics.drawParticles();

		if(!gameOver) {
			//If the game is actively running
			//Draw the player & balls
			graphics.drawPlayer(paddleLoc);
			for(var ball = 0; ball < balls.length; ball++) {
				graphics.drawBall(balls[ball]);
			}

			//draw intact bricks
			for(var row = bricks.length - 1; row >= 0; row--) {
				for(var brick = 0; brick < bricks[row].length; brick++) {
					if(bricks[row][brick].intact) {
						graphics.drawBrick(bricks[row][brick]);
					}
				}
			}

			//draw current countdown if the countdown is active
			if(countdown > 0) {
				graphics.drawCountdown(Math.ceil(countdown));
			}
		}
		else {
			//otherwise draw game over
			graphics.drawBreakoutOver();
		}

		//so player can see lives and score
		graphics.drawLives(lives);
		graphics.drawPoints(points);
	}

	//standard functions for other classes to interact with
	function initalize() {
		
	}

	function run() {
		var keybinds = settings.getKeyBinds();
		keyboard.registerCommand(keybinds.left, movePlayerLeft);
		keyboard.registerCommand(keybinds.right, movePlayerRight);
		keyboard.registerCommand(keybinds.quit, quitBreakout);

		running = true;
		gameOver = false;

		countdown = 3;

		lives = 3;
		points = 0;
		bricksDestroyed = 0;

		newBallPoints = 0;
		speedUps = 0;
		shrunk = false;

		paddleLoc = PlayerPaddle({x:375, y:865, w:180, h:20, s:650});

		balls = [];
		balls.push(Ball({
			x: paddleLoc.x + paddleLoc.w / 2,
			y: paddleLoc.y - 17,
			r: 15,
			v: {
				spd: 550,
				angle: Math.PI / 4
			},
			speedUps:0
		}));

		bricks = [];
		rowsCleared = [];
		for(var row = 0; row < 8; row++) {
			bricks.push([]);
			rowsCleared.push(false);

			var pts = 0;

			switch(row) {
				case 0:
				case 1:
					pts = 5;
					break;
				case 2:
				case 3:
					pts = 3;
					break;
				case 4:
				case 5:
					pts = 2;
					break;
				case 6:
				case 7:
					pts = 1;
					break;
			}
			for(var brick = 0; brick < 14; brick++) {
				bricks[row].push(Brick({x:1000 / 14 * brick, y: 75 + 40 * row, w: 71, h:40, intact:true, points:pts}));
			}
		}

		//clear particles from buffer on startup.
		graphics.clearParticles();
		
		currentTime = performance.now();

		currentFrame = window.requestAnimationFrame(gameLoop);
	}

	return {
		initalize: initalize,
		run: run
	};
}(Breakout.game, Breakout.input, Breakout.graphics, Breakout.screens['settings'], Breakout.screens['high-score']));