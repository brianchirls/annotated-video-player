//ffmpeg -i temp.mp4 -ss 0:0:20 -vframes 1 blah.jpg
var fs = require('fs'),
	exec = require('child_process').exec,
	path = __dirname + '/../frames/',
	popData,
	i = 0;

//borrowed from popcorn.js
function toSeconds( timeStr, framerate ) {
	// Hours and minutes are optional
	// Seconds must be specified
	// Seconds can be followed by milliseconds OR by the frame information
	var validTimeFormat = /^([0-9]+:){0,2}[0-9]+([.;][0-9]+)?$/,
		errorMessage = "Invalid time format",
		digitPairs, lastIndex, lastPair, firstPair,
		frameInfo, frameTime;

	if ( typeof timeStr === "number" ) {
		return timeStr;
	}

	if ( typeof timeStr === "string" &&
			!validTimeFormat.test( timeStr ) ) {
		Popcorn.error( errorMessage );
	}

	digitPairs = timeStr.split( ":" );
	lastIndex = digitPairs.length - 1;
	lastPair = digitPairs[ lastIndex ];

	// Fix last element:
	if ( lastPair.indexOf( ";" ) > -1 ) {

		frameInfo = lastPair.split( ";" );
		frameTime = 0;

		if ( framerate && ( typeof framerate === "number" ) ) {
			frameTime = parseFloat( frameInfo[ 1 ], 10 ) / framerate;
		}

		digitPairs[ lastIndex ] = parseInt( frameInfo[ 0 ], 10 ) + frameTime;
	}

	firstPair = digitPairs[ 0 ];

	return {

		1: parseFloat( firstPair, 10 ),

		2: ( parseInt( firstPair, 10 ) * 60 ) +
				parseFloat( digitPairs[ 1 ], 10 ),

		3: ( parseInt( firstPair, 10 ) * 3600 ) +
			( parseInt( digitPairs[ 1 ], 10 ) * 60 ) +
				parseFloat( digitPairs[ 2 ], 10 )

	}[ digitPairs.length || 1 ];
}

function process() {
	var item, seconds;

	if (i >= popData.length) {
		console.log('done');
		return;
	}

	for (; i < popData.length; i++) {
		item = popData[i];
		if (item.plugin === 'annotation') {
			seconds = toSeconds(item.frameThumbnail || item.start);
			console.log('processing event at ' + seconds + 's ' + item.headline);
			exec('ffmpeg -i ' + __dirname + '/../video/temp.mp4 -s 82x46 -ss ' + seconds + ' -vframes 1 ' + __dirname + '/../frames/frame' + seconds + '.jpg', process);
			i++;
			break;
		}
	}
}

fs.readFile(__dirname + '/../data/data.json', 'utf8', function(err, data) {
	if (err) {
		console.log(err);
		return;
	}
	
	popData = JSON.parse(data);
	
	process();
});
