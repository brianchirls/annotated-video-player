(function (window, Popcorn) {
	"use strict";

	var document = window.document,
		styleSheet,
		head = document.head || document.getElementsByTagName('head')[0];

	Popcorn.basePlugin('chapter', function(options, base) {
		var media = this.media, targetTime;
		
		function setMediaTime(time) {
			if (time < 0) {
				time = 0;
			}

			if (media.duration) {
				if (media.duration > time) {
					targetTime = time;
					media.currentTime = time;
				}
			} else {
				targetTime = time;
				media.addEventListener('loadedmetadata', function() {
					if (media.duration > targetTime) {
						media.currentTime = targetTime;
					}
				}, false);
			}
		}
		
		if (!base.target || !options.title) {
			return;
		}
		
		//todo: add stylesheet with basePlugin
		if (!styleSheet) {
			styleSheet = document.createElement('style');
			styleSheet.setAttribute('type', 'text/css');
			styleSheet.appendChild(
				document.createTextNode('.popcorn-chapter { cursor: pointer; }\n'
			));
			head.appendChild(styleSheet);
		}

		base.makeContainer();

		base.container.appendChild(document.createTextNode(options.title));
		base.container.addEventListener('click', function() {
			setMediaTime(options.start);
		}, false);
		
		window.addEventListener('popstate', function() {
			if (options.id && window.location.hash.substr(1) === options.id) {
				setMediaTime(options.start);
			}
		}, false);

		if (options.id && window.location.hash.substr(1) === options.id) {
			setMediaTime(options.start);
		}
		
		return {
			start: function( event, options ) {
				base.addClass(base.container, 'active');
			},
			end: function( event, options ) {
				base.removeClass(base.container, 'active');
			}
		};
	});
	
})( window, Popcorn );
