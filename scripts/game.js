Breakout = {
	screens: {},
}

Breakout.game = (function(screens) {
	'use strict';

	function initalize() {
		var screen = null;

		for(screen in screens) {
			if(screens.hasOwnProperty(screen)) {
				screens[screen].initalize();
			}
		}

		showScreen('main-menu');
	}

	function showScreen(id) {
		var screen = 0,
			active = null;

		active = document.getElementsByClassName('active');
		for(screen = 0; screen < active.length; screen++) {
			active[screen].classList.remove('active');
		}

		screens[id].run();

		document.getElementById(id).classList.add('active');
	}

	return {
		initalize: initalize,
		showScreen: showScreen
	}
}(Breakout.screens));