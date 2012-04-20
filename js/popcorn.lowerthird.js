// PLUGIN: words

(function (Popcorn) {

"use strict";

	var styleSheet;

	Popcorn.basePlugin( 'lowerthird' , function(options, base) {
		var popcorn,
			video,
			classes,
			container,
			textContainer,
			title, subtitle, node, i;
		
		if (!base.target || !options.title) {
			return;
		}

		popcorn = this;
		video = popcorn.media;

		//todo: add stylesheet with basePlugin
		if (!styleSheet) {
			styleSheet = document.createElement('style');
			styleSheet.setAttribute('type', 'text/css');
			styleSheet.appendChild(
				document.createTextNode(
					'.popcorn-lowerthird { display: none; color: white; text-shadow: black 2px 2px 6px; ' +
						'padding-left: 1em; width: 100%; position: absolute; bottom: 0.5em; }\n' +
					'.popcorn-lowerthird.active { display: block; }\n' +
					'.popcorn-lowerthird > a { color: white; }\n' +
					'.popcorn-lowerthird-title { font-size: 2.5em; font-weight: bold; }\n' +
					'.popcorn-lowerthird-subtitle { font-size: 1.5em; }\n'
			));
			document.head.appendChild(styleSheet);
		}

		container = base.makeContainer();

		container.style.cssText = options.style || '';

		//todo: do all of this positioning stuff with basePlugin
		i = options.top;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.top = i;
			container.style.position = 'absolute';
		}

		i = options.left;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.left = i;
			container.style.position = 'absolute';
		}
		
		i = options.right;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.right = i;
			container.style.position = 'absolute';
		}
		
		i = options.bottom;
		if (i || i === 0) {
			if (!isNaN(i)) {
				i += 'px';
			}
			container.style.bottom = i;
			container.style.position = 'absolute';
		}

		base.animate('top', function(val) {
			container.style.top = val;
		});
		base.animate('left', function(val) {
			container.style.left = val;
		});
		base.animate('right', function(val) {
			container.style.right = val;
		});
		base.animate('bottom', function(val) {
			container.style.bottom = val;
		});

		
		if (options.align) {
			container.style.textAlign = options.align;
		}
		
		if (options.classes) {
			base.addClass(container, options.classes);
		}
		
		if (options.link) {
			//todo: localize link
			textContainer = document.createElement('a');
			textContainer.setAttribute('href', options.link);
			if (options.linkTarget) {
				textContainer.setAttribute('target', options.linkTarget);
			} else {
				textContainer.setAttribute('target', '_new');
			}

			//pause video when link is clicked
			textContainer.addEventListener('click', function() {
				video.pause();
			}, false);

			container.appendChild(textContainer);
		} else {
			textContainer = container;
		}

		//todo: localize
		title = document.createElement(options.titleTag || 'div');
		base.addClass(title, 'popcorn-lowerthird-title');
		title.appendChild(document.createTextNode(options.title));
		textContainer.appendChild(title);

		if (options.subtitle) {
			subtitle = document.createElement(options.subtitleTag || 'div');
			base.addClass(subtitle, 'popcorn-lowerthird-subtitle');
			subtitle.appendChild(document.createTextNode(options.subtitle));
			textContainer.appendChild(subtitle);
		}

		if (typeof options.onLoad === 'function') {
			options.onLoad(options);
		}

		return {
			start: function( event, options ) {
				base.addClass(base.container, 'active');
				base.container.style.opacity = '';
			},
			frame: function( event, options, time ) {
				var opacity, t;

				if (!isNaN(options.fadeIn) && options.fadeIn > 0) {
					t = time - base.options.start;
					if (t < options.fadeIn) {
						opacity = t / options.fadeIn;
						if (base.container.style.opacity !== opacity) {
							base.container.style.opacity = opacity;
						}
						return;
					}
				}

				if (!isNaN(options.fadeOut) && options.fadeOut > 0) {
					t = base.options.end - time;
					if (t < options.fadeOut) {
						opacity = t / options.fadeOut;
						if (base.container.style.opacity !== opacity) {
							base.container.style.opacity = opacity;
						}
						return;
					}
				}

				if (base.container.style.opacity !== '') {
					base.container.style.opacity = '';
				}

			},
			end: function( event, options ) {
				base.removeClass(base.container, 'active');
			}
		};
	});
}( Popcorn ));
