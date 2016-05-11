Breakout.screens['help'] = (function(game) {
	function initalize() {
		document.getElementById('help->main').addEventListener('click', function() {
			game.showScreen('main-menu');
		});
	}

	function run() {
		//just html menu
	}

	return {
		initalize: initalize,
		run: run
	};
}(Breakout.game));

Breakout.screens['about'] = (function(game) {
	function initalize() {
		document.getElementById('about->main').addEventListener('click', function() {
			game.showScreen('main-menu');
		});
	}

	function run() {
		//just html menu
	}

	return {
		initalize: initalize,
		run: run
	};
}(Breakout.game));