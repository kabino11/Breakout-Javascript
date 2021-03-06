Breakout.screens['main-menu'] = (function(game) {
	function initalize() {
		document.getElementById('main->new-game').addEventListener('click', function() {
			game.showScreen('game-play');
		});

		document.getElementById('main->high-score').addEventListener('click', function() {
			game.showScreen('high-score');
		});

		document.getElementById('main->settings').addEventListener('click', function() {
			game.showScreen('settings');
		});

		document.getElementById('main->help').addEventListener('click', function() {
			game.showScreen('help');
		});

		document.getElementById('main->about').addEventListener('click', function() {
			game.showScreen('about');
		});
	}

	function run() {
		//leave empty, for this is just html...
	}

	return {
		initalize: initalize,
		run: run
	}
}(Breakout.game));