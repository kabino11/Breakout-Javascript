Breakout.graphics = (function() {
	'use strict';

	//initalize canvas
	var canvas = document.getElementById('gameplay-canvas'),
		context = canvas.getContext('2d');

	var greenBrick = new Image();
	greenBrick.src = 'textures/greenbrick.png';
	var yellowBrick = new Image();
	yellowBrick.src = 'textures/yellowbrick.png';
	var orangeBrick = new Image();
	orangeBrick.src = 'textures/orangebrick.png';
	var blueBrick = new Image();
	blueBrick.src = 'textures/bluebrick.png';

	var lifeIcon = new Image();
	lifeIcon.src = 'textures/phone-small-dark.png';

	var destructionParticles = ParticleSystem( {
			image : 'textures/greenspark.png',
			speed: {mean: 50, stdev: 10},
			lifetime: {mean: 1, stdev: .5}
		},
		{
			drawImage: drawImage
		}
	);

	function spawnParticle(location) {
		location.direction = Random.nextCircleVector();

		destructionParticles.create(location);
	}

	function spawnParticleUp(location) {
		location.direction = Random.nextTopQuarterVector();

		destructionParticles.create(location);
	}

	function updateParticles(timePassed) {
		destructionParticles.update(timePassed);
	}

	function clearParticles() {
		destructionParticles.clear();
	}

	function drawParticles() {
		destructionParticles.render();
	}

	//create methods to clear canvas
	CanvasRenderingContext2D.prototype.clear = function() {
		this.save();
		this.setTransform(1, 0, 0, 1, 0, 0);
		this.clearRect(0, 0, canvas.width, canvas.height);
		this.restore();
	};

	function clear() {
		context.clear();
	}

	function drawPlayer(spec) {
		context.save();

		context.beginPath();

		context.fillStyle = '#0cde0c';
		context.rect(spec.x, spec.y, spec.w, spec.h);
		context.lineWidth = 2;
		context.fill();
		context.stroke();

		context.restore();
	}

	function drawBall(spec) {
		context.save();

		context.beginPath();

		context.fillStyle = '#0cde0c';
		context.lineWidth = 2;
		context.arc(spec.x, spec.y, spec.r, 0, 2 * Math.PI);
		context.fill();
		context.stroke();

		context.restore();
	}

	function drawBrick(spec) {
		context.save();

		context.beginPath();

		var imageOut;

		switch(spec.points) {
			case 5:
				imageOut = greenBrick;
				break;
			case 3:
				imageOut = blueBrick;
				break;
			case 2:
				imageOut = orangeBrick;
				break;
			case 1:
				imageOut = yellowBrick;
				break;
			default:
				return;
		}

		context.drawImage(imageOut, spec.x - 1, spec.y, spec.w + 2, spec.h);

		context.restore();
	}

	function drawLives(lifeCount) {
		context.save();

		//context.font = '25pt matrixFont';
		//context.fillStyle = '#0cde0c';
		//context.fillText('Lives: ' + lifeCount, 20, 845);

		var begin = 20;

		for(var count = 0; count < lifeCount; count++) {
			context.drawImage(lifeIcon, begin + count * 30, 800, 30, 50);
		}

		context.restore();
	}

	function drawPoints(points) {
		context.save();

		context.font = '25pt matrixFont';
		context.lineWidth = 2;
		context.fillStyle = '#0cde0c';
		context.fillText('Points: ' + points, 835, 845);

		context.restore();
	}

	function drawCountdown(num) {
		context.save();

		context.font = '200pt matrixFont';
		context.fillStyle = '#0cde0c';
		context.lineWidth = 5;
		context.fillText(num, 440, 425);
		context.strokeText(num, 440, 425);

		context.restore();
	}

	function drawBreakoutOver() {
		context.save();

		context.beginPath();

		context.font = '100px matrixFont';
		context.fillStyle = '#0cde0c';
		context.fillText('GAME OVER', canvas.width / 2 - 300, canvas.height / 3);

		context.restore();
	}

	function drawImage(spec) {
		context.save();
		
		context.translate(spec.center.x, spec.center.y);
		context.rotate(spec.rotation);
		context.translate(-spec.center.x, -spec.center.y);
		
		context.drawImage(
			spec.image, 
			spec.center.x - spec.size/2, 
			spec.center.y - spec.size/2,
			spec.size, spec.size);
		
		context.restore();
	}

	return {
		clear: clear,
		drawPlayer: drawPlayer,
		drawBall: drawBall,
		drawBrick: drawBrick,
		drawLives: drawLives,
		drawPoints: drawPoints,
		drawCountdown: drawCountdown,
		drawBreakoutOver: drawBreakoutOver,
		drawImage: drawImage,
		spawnParticle: spawnParticle,
		spawnParticleUp: spawnParticleUp,
		clearParticles: clearParticles,
		updateParticles: updateParticles,
		drawParticles: drawParticles
	};
}());