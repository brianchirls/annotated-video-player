(function (window, $) {
	"use strict";

	var document = window.document,
		console = window.console,
		
		popcorn, video, defaults,
		chapters = {}, annotations = [],
		chapterOrder = [],
		visibleAnnotations = [],
		selectedAnnotation;
	
	function setAnnotationChapters(options, base, chaps) {
		/*
		figure out which chapter this annotation is in
		and set class accordingly
		*/
		var id, ch, element, chapterIndex;
		if (!chaps) {
			chaps = chapters;
		}

		if (base.container) {
			element = $(base.container);

			for (id in chaps) {
				ch = chaps[id];
				chapterIndex = chapterOrder.indexOf(ch);
				if (ch.start < options.end && ch.end > options.start) {
					element.addClass(id);
					options.chapterIndex = chapterIndex;
				} else {
					element.removeClass(id);
				}
			}
		}
	}
	
	function refreshAnnotationView(base) {
		//sort in reverse order
		function sortFn(a, b) {
			if (a.start === b.start) {
				return b.end - a.end;
			}
			
			return b.start - a.start;
		}
		
		var i = -1;
		
		if (!visibleAnnotations.length) {
			selectedAnnotation = null;
			return;
		}
				
		if (selectedAnnotation) {
			i = visibleAnnotations.indexOf(selectedAnnotation);
		}
		if (i < 0) {
			visibleAnnotations.sort(sortFn);
			i = 0;
		}
		visibleAnnotations.forEach(function(options, index) {
			if (index === i) {
				$(options.base.container).addClass('selected');
			} else {
				$(options.base.container).removeClass('selected');
			}
		});
	}

	// Popcorn callbacks
	defaults = {
		chapter: {
			target: 'chapters',
			onSetup: function(options) {
				//set up classes for hiding/showing annotations by chapter
				var i, style, chaps, header;
				
				function sortFn(a, b) {
					if (a.start === b.start) {
						return a.end - b.end;
					}
					
					return a.start - b.start;
				}
/*
				style = document.createElement('style');
				style.setAttribute('type', 'text/css');
				style.appendChild(
					document.createTextNode('#annotations.' + options.id + ' > .popcorn-annotation.' + options.id + ' { display: inline; }\n' +
					'#annotations.all > .popcorn-annotation.' + options.id + ' { display: block; }\n'
				));
				document.head.appendChild(style);
				options.style = style;
*/
				chapters[options.id] = options;
				
				chapterOrder.push(options);
				chapterOrder.sort(sortFn);
				
				chaps = {};
				chaps[options.id] = options;
				for (i = 0; i < annotations.length; i++) {
					setAnnotationChapters(annotations[i], this, chaps);
				}
				
				//add chapter number header
				if (options.header) {
					header = document.createElement('div');
					header.appendChild(document.createTextNode(options.header));
					this.container.insertBefore(header, this.container.firstChild);
				}

				$('#chapter-next').removeClass('limit');
			},
			onStart: function(options) {
				var i = chapterOrder.indexOf(options) + 1;
				
				//$('#related-chapter').text('Related Content for Chapter ' + i);
				$('#annotations').addClass(options.id);
				$('#related-chapter-number').html(i);

				if (i === 1) {
					$('#chapter-back').addClass('limit');
				} else {
					$('#chapter-back').removeClass('limit');
				}

				if (i === chapterOrder.length) {
					$('#chapter-next').addClass('limit');
				} else {
					$('#chapter-next').removeClass('limit');
				}
			},
			onEnd: function(options) {
				//todo: clear label of "related content for chapter X"
				$('#annotations').removeClass(options.id);
			},
			onTeardown: function(options) {
				if (options.id) {
					delete chapters[options.id];
				}
				if (options.style && options.style.parentNode) {
					options.style.parentNode.removeChild(options.style);
				}
			}
		},
		annotation: {
			target: 'annotations',
			onSetup: function(options) {
				function timeToText(t) {
					var hr, sec, min;

					//assume t in seconds
					t = Math.floor(t);
					sec = t % 60;
					min = (t - sec) / 60;
					if (sec < 10) {
						sec = '0' + sec;
					}
					if (min > 59) {
						hr = Math.floor(min / 60);
						min = min % 60;
						if (min < 10) {
							min = '0' + min;
						}
						return hr + ':' + min + ':' + sec;
					}
					return min + ':' + sec;
				}

				var vid, main, div, jump, jumpFn, c, img, base = this, player;

				options.base = base;

				vid = $('video', base.container);
				if (vid && vid.length) {
					player = new VideoPlayer(vid[0]);
					vid.bind('play', function() {
						video.pause();
					});
				}

				annotations.push(options);
				setAnnotationChapters(options, this);
				$('.title', base.container).click(function() {
					selectedAnnotation = options;
					refreshAnnotationView(base);
				});
				
				//load up video frame preview
				main = $('.title + div', base.container);
				main = main[0];

				//move everything from main inside another div
				div = document.createElement('div');
				$(div).addClass('annotation-container');
				while (main.childNodes.length) {
					console.log(main.firstChild.nodeName);
					div.appendChild(main.firstChild);
				}
				main.appendChild(div);

				div = document.createElement('div');
				$(div).addClass('annotation-handle');
				main.insertBefore(div, main.firstChild);
				div.appendChild(div = document.createElement('div'));
				
				img = document.createElement('img');
				img.src = 'frames/frame' + options.start + '.jpg';
				img.addEventListener('load', function() {
					div.insertBefore(img, div.firstChild);
					img.addEventListener('click', jumpFn);
				}, false);

				c = options.chapterIndex + 1;
				$(div).append('<span>Chapter ' + c + '</span>');
				jumpFn = function() {
					video.currentTime = options.start;
					video.scrollIntoView();
					video.play();
				};
				
				div.appendChild(document.createTextNode(' '));
				
				jump = document.createElement('time');
				jump.appendChild(document.createTextNode(timeToText(options.start)));
				jump.addEventListener('click', jumpFn);
				div.appendChild(jump);
				
				jump = document.createElement('span');
				$(jump).addClass('button');
				jump.appendChild(document.createTextNode(' '));
				jump.addEventListener('click', jumpFn);
				div.appendChild(jump);
			},
			onStart: function(options) {
				var i = visibleAnnotations.indexOf(options);
				if (i < 0) {
					visibleAnnotations.unshift(options);
				}
				refreshAnnotationView(this);
			},
			onEnd: function(options) {
				var vid, i;
				
				vid = $('video', this.container);
				if (vid && vid.length) {
					vid[0].pause();
				}

				i = visibleAnnotations.indexOf(options);
				if (i >= 0) {
					visibleAnnotations.splice(i, 1);
				}
				$(this.container).removeClass('selected');
				refreshAnnotationView(this);
			},
			onTearDown: function(options) {
				var i = annotations.indexOf(options);
				if (i >= 0) {
					annotations.splice(i, 1);
				}
			}
		}
	};

	function loadPopcornEvents(data, textStatus, jqXHR) {
		var i, event, plugin, def, field, next,
			events, j,
			eventsByPlugin = {};

		function sortFn(a, b) {
			if (a.plugin < b.plugin) {
				return -1;
			}

			if (b.plugin < a.plugin) {
				return 1;
			}

			return a.start - b.start;
		}

		for (i = 0; i < data.length; i++) {
			event = data[i];
			plugin = event.plugin;
			if (!eventsByPlugin[plugin]) {
				eventsByPlugin[plugin] = [];
			}
			eventsByPlugin[plugin].push(event);
		}

		for (plugin in eventsByPlugin) {
			eventsByPlugin[plugin].sort(sortFn);
		}

		//first, pre-scan chapter events and set end times based on following event
		events = eventsByPlugin.chapter;
		for (i = 0; i < events.length; i++) {
			event = events[i];
			next = events[i + 1];
			if (!next) {
				event.end = video.duration || Number.MAX_VALUE || Infinity;
			} else {
				event.end = next.start;
			}
		}

		//set end time for all annotations to that of its chapter
		events = eventsByPlugin.annotation;
		for (i = 0; i < events.length; i++) {
			event = events[i];
			def = eventsByPlugin.chapter.filter(function (chapter) {
				return chapter.start <= event.start && chapter.end > event.start;
			});
			def = def[0];
			if (def) {
				event.end = def.end;
			}
		}
		
		for (i = 0; i < data.length; i++) {
			event = data[i];
			plugin = event.plugin;
			
			def = defaults[plugin];
			if (def) {
				for (field in def) {
					event[field] = def[field];
				}
			}
			
			if (typeof popcorn[plugin] === 'function') {
				delete event.plugin;
				popcorn[plugin](event);
			}
		}

		//chapter next/back buttons
		$('#chapter-next').click(function() {
			var c, t = popcorn.currentTime();
			c = chapterOrder.filter(function(chapter) {
				return chapter.start <= t && chapter.end > t;
			});
			if (!c.length) {
				return;
			}
			c = c[0];
			if (c.end < popcorn.duration()) {
				popcorn.currentTime(c.end);
			}
		});

		$('#chapter-back').click(function() {
			var c, t = popcorn.currentTime();
			c = chapterOrder.filter(function(chapter) {
				return chapter.end <= t;
			});
			if (!c.length) {
				return;
			}
			c = c.pop();
			popcorn.currentTime(c.start);
		});
	}

	function initialize() {
		var player;

		if (!Modernizr.video) {
			//todo: handle no html5 video
			return;
		}

		popcorn = Popcorn('#video', {
			frameAnimation: true
		});
		video = popcorn.media;

		popcorn.defaults('lowerthird', {
			fadeIn: 0.5,
			fadeOut: 0.5
		});
		
		//load popcorn events
		$.ajax({
			url: 'data/data.json',
			success: loadPopcornEvents
		});
		
		$('#related-chapter').click(function() {
			$('#meta-container').removeClass('all');
			$('#related-all').removeClass('active');
			$('#related-chapter').addClass('active');
		});
		
		$('#related-all').click(function() {
			$('#meta-container').addClass('all');
			$('#related-chapter').removeClass('active');
			$('#related-all').addClass('active');
		});
		
		$('.close-related-all').click(function() {
			$('#meta-container').removeClass('all');
			$('#related-chapter').addClass('active');
			$('#related-all').removeClass('active');
		});

		//todo: clean this up
		player = new VideoPlayer({
			media: video,
			callback: function(ctx) {
				var i, x, width = ctx.canvas.width - 12;
				if (!video.duration) {
					return;
				}
				ctx.strokeStyle = '#303030';
				ctx.lineWidth = 2;
				ctx.lineCap = 'butt';
				ctx.beginPath();
				for (i in chapters) {
					if (chapters[i].start) {
						x = 6 + width * chapters[i].start / video.duration;
						ctx.moveTo(x, 6);
						ctx.lineTo(x, 18);
					}
				}
				ctx.stroke();
			}
		});
	}

	$(initialize);

}( window, window.jQuery ));
