(function (window) {
	"use strict";
	
	var document = window.document,
		stylesheet,
		addClass, removeClass,

	//  Non-public `requestAnimFrame`
	//  http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	requestAnimFrame = (function(){
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function( callback, element ) {
				window.setTimeout( callback, 16 );
			};
	}());


	if (typeof document !== 'undefined' &&
		!('classList' in document.createElement('a'))) {
			
		addClass = function(element, classes) {
			var curClasses, i;
			if (!classes || !element || !element.getAttribute) {
				return;
			}

			classes = classes.split(/\s\t\r\n /);
			curClasses = element.getAttribute('class') || '';
			curClasses = curClasses.split(/\s\t\r\n /);
			
			for (i = 0; i < classes.length; i++) {
				if (curClasses.indexOf(classes[i]) < 0) {
					curClasses.push(classes[i]);
				}
			}

			element.setAttribute('class', curClasses.join(' '));
		};

		removeClass = function(element, classes) {
			var curClasses, i, index;

			if (!classes || !element || !element.getAttribute) {
				return;
			}

			classes = classes.split(/\s\t\r\n /);
			curClasses = element.getAttribute('class') || '';
			curClasses = curClasses.split(/[\s\t\r\n ]+/);

			for (i = 0; i < classes.length; i++) {
				index = curClasses.indexOf(classes[i]);
				if (index >= 0) {
					curClasses.splice(index, 1);
				}
			}
			
			element.setAttribute('class', curClasses.join(' '));
		};
	} else {
		addClass = function(element, classes) {

			if (!element || !element.classList) {
				return;
			}

			element.classList.add(classes);
		};

		removeClass = function(element, classes) {
			if (!element || !element.classList) {
				return;
			}

			element.classList.remove(classes);
		};
	}

	function applyMouseTouchHandlers(element, down, move, up) {
		element.onmousedown = function(e) {
			if (down) {
				if (down(e || window.event) && e.preventDefault) {
					e.preventDefault();
				} else {
					return;
				}
			}
			if (move) {
				document.onmousemove = function(e) {
					move(e || window.event);
				};
			}
			document.onmouseup = function(e) {
				if (up) {
					up(e || window.event);
				}
				document.onmousemove = null;
				document.onmouseup = null;
			};
		};
		
		element.ontouchstart = function(e) {
			if (e.preventDefault) { e.preventDefault(); }
			element.onmousedown = null;
		
			if (down) {
				down(e.touches[0] || window.event);
			}
		
			if (move) {
				document.ontouchmove = function(e) {
					move(e.touches[0] || window.event);
					return false;
				};
			}
			document.ontouchend = function(e) {
				//up(e.touches[0]);
				if (up) {
					up();
				}
				document.ontouchmove = null;
				document.ontouchend = null;
			};
		
		};
	}
	
	function getMousePosition(event) {
		var posx; // = 0;
		var posy; // = 0;
		//if (!e) var e = window.event;
		if (event) {
			if (event.pageX !== undefined || event.pageY !== undefined) {
				posx = event.pageX;
				posy = event.pageY;
			} else if (event.clientX !== undefined || event.clientY !== undefined) {
				posx = event.clientX + document.body.scrollLeft +
					document.documentElement.scrollLeft;
				posy = event.clientY + document.body.scrollTop +
					document.documentElement.scrollTop;
			}
			// posx and posy contain the mouse position relative to the document
		}
		
		return {
			x: posx,
			y: posy
		};
	}
	
	function offsetMousePosition(pos, element) {
		var parent = element;
		pos.x -= element.clientLeft + element.offsetLeft;
		pos.y -= element.clientTop + element.offsetTop;
		while ((parent = parent.offsetParent) && parent.nodeName !== 'BODY') {
			pos.x -= parent.clientLeft + parent.offsetLeft;
			pos.y -= parent.clientTop + parent.offsetTop;
		}
	}

	/**
	* Draws a rounded rectangle using the current state of the canvas.
	* If you omit the last three params, it will draw a rectangle
	* outline with a 5 pixel border radius
	* @param {CanvasRenderingContext2D} ctx
	* @param {Number} x The top left x coordinate
	* @param {Number} y The top left y coordinate
	* @param {Number} width The width of the rectangle
	* @param {Number} height The height of the rectangle
	* @param {Number} radius The corner radius. Defaults to 5;
	* @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
	* @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
	*
	* borrowed from http://js-bits.blogspot.com/2010/07/canvas-rounded-corner-rectangles.html
	*/
	function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
		if (typeof stroke == "undefined" ) {
			stroke = true;
		}
		if (typeof radius === "undefined") {
			radius = 5;
		}
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();

		if (stroke) {
			ctx.stroke();
		}
		if (fill) {
			ctx.fill();
		}
	}
	
	function VideoPlayer(options) {
		var canvas,
			media,
			main,
			playPause, timer,
			ctx,
			videoWidth = 0,
			widthDiff = (6 + 15 + 15) * 2 + 101 + 54,
			me = this,
			paused, currentTime, volume, duration, resized = false;
		
		canvas = document.createElement('canvas');

		if (!options || !canvas) {
			return;
		}
		
		if (typeof options === 'string') {
			this.media = document.querySelector(options);
			options = {};
		} else if (options instanceof window.HTMLMediaElement) {
			this.media = options;
			options = {};
		} else if (typeof options.media === 'string') {
			this.media = document.querySelector(options.media);
		} else {
			this.media = options.media;
		}
		
		if (!(this.media instanceof window.HTMLMediaElement)) {
			this.media = null;
			return;
		}

		media = this.media;
		media.controls = false;
		
		if (!stylesheet) {
			stylesheet = document.createElement('style');
			stylesheet.appendChild(document.createTextNode('.video-player { position: absolute; height: 39px; border-radius: 4px; background-color: rgba(26, 21, 15, 0.5); padding: 8px 15px; bottom: 6px; left: 6px; opacity: 0;  -webkit-transition: opacity 0.5s; -moz-transition: opacity 0.5s;  -ie-transition: opacity 0.5s; -o-transition: opacity 0.5s; transition: opacity 0.5s; }\n' +
			'.video-player > * { cursor: pointer; display: inline; color: rgba(255, 255, 255, 0.6); font-family: sans-serif; font-size: 14px; }\n' +
			'.video-player-control { border-radius: 4px; background-color: rgba(46, 41, 35, 0.6); height: 100%; display: inline-block; }\n' +
			'*:hover > .video-player { opacity: 1; -webkit-transition: opacity 0.2s; -moz-transition: opacity 0.1s;  -ie-transition: opacity 0.1s; -o-transition: opacity 0.1s; transition: opacity 0.1s; }\n' +
			'.video-player-play {width: 54px; float: left; background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAARCAYAAADUryzEAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sMHRUmNCspMgUAAACYSURBVDjLpZIhDsJAEEXfkEFg4AQVGK6C4fqYFSBagakFUZKPoWTTbEun/W6TeW8yM2uSzkAHJDNrCMYkXbL3MyoaCsKiMUGfDrgDNzN7lwr8T4MtcAKOkooinznqqMiDS89FDyBFBbmoAg4b1sV9BdwCV18IJjNro0usgaYHI2esvx1f0Y80CU4JZoElQQj8RdJe0m7pLT9jzkKaeyyJOQAAAABJRU5ErkJggg=="); background-repeat: no-repeat; background-position: center; } \n' +
			'.video-player-play.playing { background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAADwMZRfAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sMHRUfOCwb85QAAABlSURBVDjL7YwhCsNQFARnPzHROUtF7y8icpanawpbkQbCZz9ElKqMnB1WtifgASzsFLBJetMxbG0/T/KgJK3hJLYtSIDF9px8co0Bkl5cpPED7pP75K8nFXwN+tg2YOvG+rpEbD95DSM2rfcI8gAAAABJRU5ErkJggg=="); } \n' +
			'.video-player-timer {width: 101px; float: right; padding: 12px; -moz-box-sizing: border-box; -o-box-sizing: border-box; -webkit-box-sizing: border-box; -ie-box-sizing: border-box; box-sizing: border-box; cursor: auto; text-align: right; font-size: 13px; } \n' +
			'.video-player.tiny .video-player-timer { display: none; } \n'));
			document.head.appendChild(stylesheet);
		}

		if (typeof options.container === 'string') {
			options.container = document.querySelector(options.container);
		}
		
		if (!(options.container instanceof window.HTMLElement)) {
			options.container = this.media.parentNode;
		}
		options.container.style.position = 'relative';
		
		main = document.createElement('div');
		main.setAttribute('class', 'video-player');
		
		playPause = document.createElement('div');
		playPause.setAttribute('class', 'video-player-control video-player-play');
		main.appendChild(playPause);

		timer = document.createElement('div');
		timer.setAttribute('class', 'video-player-control video-player-timer');
		main.appendChild(timer);

		//todo: volume control
		
		canvas = canvas;
		ctx = canvas.getContext('2d');
		canvas.height = 20;
		canvas.style.margin = '9px 15px 0';
		//canvas.width = 458; //todo: calculate this automatically
		main.appendChild(canvas);
		

		if (options.container) {
			options.container.appendChild(main);
		}
		
		if (media) {
			playPause.addEventListener('click', function() {
				if (media.paused) {
					media.play();
				} else {
					media.pause();
				}
			}, false);
		}
		
		var shuttlePaused = true;
		function mouseShuttle(event) {
			//ignore right-click
			var rightClick;
			if (event.which) {
				rightClick = (event.which === 3);
			} else if (event.button) {
				rightClick = (event.button === 2);
			}
			if (rightClick) {
				return false;
			}
			
			shuttlePaused = shuttlePaused && media.paused;

			var pos = getMousePosition(event);
			offsetMousePosition(pos, canvas);
			var t = (pos.x - 8.5) / (canvas.offsetWidth - 17);
			if (t >= 0 && t <= 1) {
				t *= media.duration;
				if (media.duration) {
					media.currentTime = t;
				}
			}
			media.pause();

			return true;
		}
		applyMouseTouchHandlers(canvas, mouseShuttle, mouseShuttle, function () {
			if (!shuttlePaused) {
				media.play();
				shuttlePaused = true;
			}
		});

		//todo: set colors and other draw parameters
		this.background = 'rgba(33, 42, 10, 0.5)';
		this.controlbg = 'rgba(33, 24, 18, 0.6)';
		this.control = 'rgba(255, 255, 255, 0.6)';
		this.controlborder = '#303030';
		this.handle = '#d9e021';
		this.handleborder = '#2e2923';

		function draw() {
			var currentTimeText, timerText;
			
			function drawProgressLine(start, end) {
				var from = start/media.duration * (canvas.width - 12) + 6,
					to = end/media.duration * (canvas.width - 12) + 6;

				/*
				if (start === 0 || end === media.duration) {
					ctx.lineCap = 'round';
				} else {
					ctx.lineCap = 'butt';
				}
				*/
				ctx.beginPath();
				ctx.moveTo(from, 12);
				ctx.lineTo(to, 12);
				ctx.stroke();
			}

			function timeToText(t) {
				//assume t in seconds
				t = Math.floor(t);
				var sec = t % 60;
				var min = (t - sec) / 60;
				if (sec < 10) {
					sec = '0' + sec;
				}
				if (min > 59) {
					var hr = Math.floor(min / 60);
					min = min % 60;
					if (min < 10) {
						min = '0' + min;
					}
					return hr + ':' + min + ':' + sec;
				}
				return min + ':' + sec;
			}
			
			//draw play/pause button
			if (paused !== media.paused) {
				paused = media.paused;
				if (paused && shuttlePaused) {
					removeClass(playPause, 'playing');
				} else {
					addClass(playPause, 'playing');
				}
			}
			
			if (videoWidth !== options.container.offsetWidth) {
				videoWidth = options.container.offsetWidth;
				canvas.width = videoWidth - widthDiff;
				if (canvas.width < 101) {
					canvas.width += 101;
					addClass(main, 'tiny');
				}
				resized = true;
			}

			//draw progress bar
			if (currentTime !== media.currentTime ||
				duration !== media.duration || resized) {
				
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.lineWidth = 12;
				
				if (media.duration) {
					//first draw loaded
					ctx.lineCap = 'round';
					ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
					drawProgressLine(0, media.duration);
					ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
					if (media.buffered) {
						var i, max, end, buffered = media.buffered;
						var start = 0, zeroLoaded = false;
						for (i = 0, max = buffered.length; i < max; i++) {
							start = buffered.start(i);
							end = buffered.end(i);
							//fix stupid Firefox bug
							if (start > media.duration || start < 0) {
								start = 0;
							}

							if (end > start) {
								drawProgressLine(start, end);
							}
						}
					} else {
						drawProgressLine(0, media.duration);
					}
					
					//draw played
					if (media.currentTime) {
						ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
						ctx.lineCap = 'round';
						drawProgressLine(0, media.currentTime);
					}
				
				}
				
				//outline
				ctx.strokeStyle = me.controlborder;
				ctx.fillStyle = me.controlborder;
				ctx.lineWidth = 2;
				roundRect(ctx, 1, 6, canvas.width - 2, 12, 7, false, true);
				resized = false;
				
				//drawing callback
				if (media.duration) {
					if (options.callback && typeof options.callback === 'function') {
						options.callback(ctx);
					}
					
					//draw play head
					ctx.fillStyle = me.handleborder;
					ctx.beginPath();
					ctx.arc(2 + 5 + (canvas.width - 16) * media.currentTime/media.duration, 12, 9, 0, Math.PI * 2);
					ctx.fill();

					ctx.fillStyle = me.handle;
					ctx.beginPath();
					ctx.arc(2 + 5 + (canvas.width - 16) * media.currentTime/media.duration, 12, 5, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			
			//draw time
			if (currentTime !== media.currentTime || duration !== media.duration) {
				if (media.duration) {
					currentTimeText = timeToText(media.currentTime);
					timerText = currentTimeText + ' / ' + timeToText(media.duration);
				} else {
					currentTimeText = '-:--';
					timerText = '-:-- / -:--';
				}
				//only update if we need to, to avoid unnecessary page redraws/reflows
				if (timer.innerHTML !== timerText) {
					timer.innerHTML = timerText;
				}
			}

			currentTime = media.currentTime;
			duration = media.duration;

			//draw volume control
			if (volume !== media.volume) {
				volume = media.volume;
			}

			requestAnimFrame(draw);
		}
		draw();
	}
	

	window.VideoPlayer = VideoPlayer;
})( window );
