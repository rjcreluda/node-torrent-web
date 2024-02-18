#!/usr/bin/env node

var torrentStream = require('torrent-stream');
var express = require('express');
var request = require('request').defaults({encoding: null});
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var os = require('os');
var del = require('del');
var mime = require('mime');
var archiver = require('archiver');
const path = require('path');

var client, url;
const tmp = path.join(__dirname, 'tmp');

//var DIR = os.tmpdir();+'/torrent-web-poc';
var DIR = './tmp/torrent-web-poc';
var PORT = 8080 || process.env.PORT;
server.listen(PORT);
app.use(express.static(__dirname + '/public'));
console.log('Torrent Web started on port '+PORT+' ...');

//===============================
// API
//===============================

io.on('connection', function (socket) {
	console.log('New socket connection. ' + new Date().toISOString());
	if (client && client.files.length) socket.emit('torrent', torrentRepresentation());
	else socket.emit('no-torrent');
	socket.on('add-torrent', addTorrent);
	socket.on('remove-torrent', removeTorrent);
});

// Route to render the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/torrent/:filename', function(req, res) {
	console.log('Torrent file request.');
	var file = findFile(req.params.filename);
	if (file) {
		var stream = file.createReadStream();
		res.set('Content-Type', mime.lookup(file.name));
		res.set('Content-Length', file.length);
		stream.pipe(res);
	}
	else res.status(404).end();
});

app.get('/torrent/', function(req, res) {
	var archive = archiver.create('zip', {});
	var filename = client.torrent.name + '.zip';
	res.set('Content-Type', 'application/zip');
	res.set('Content-disposition', 'attachment; filename=' + filename);
	archive.pipe(res);
	client.files.forEach(function(file) {
		archive.append(file.createReadStream(), {name: file.path});
	});
	archive.finalize();
});

//===============================
// Main functions
//===============================

function findFile(filename) {
	var f = null;
	client.files.forEach(function(file) {
		if (file.name === filename) f = file;
	});
	return f;
}

function addTorrent(incoming) {
	removeTorrent();
	url = incoming;
	console.log('Adding torrent ... ');
	if (url.indexOf('magnet:') === 0) createTorrentEngine(url);
	else {
		request.get(url, function(err, res, body) {
			createTorrentEngine(body);
		});
	}
}

function removeTorrent() {
	if (client) {
		console.log('Destroying client.');
		client.destroy();
		client = null;

		io.emit('torrent-removed');
	}
	deleteFiles();
}

//===============================
// Helper functions
//===============================

/**
 * Checks process.argv for one beginning with arg+'='
 * @param {string} arg
 */
function parseArg(arg) {
	for (var i = 0; i < process.argv.length; i++) {
		var val = process.argv[i];
		if (startsWith(val, arg+'=')) return val.substring(arg.length+1);
	}
	function startsWith(string, beginsWith) {
		return string.indexOf(beginsWith) === 0;
	}
}

function deleteFiles() {
	setTimeout(function() {
		del.sync(DIR+'/**', {force: true});
	}, 1000)
}

function createTorrentEngine(torrent) {
	try {
	    console.log('createTorrentEngine() ...')
		client = torrentStream(torrent, {
			uploads: 3,
			connections: 30,
			path: DIR, 
			tmp: tmp
		});
		console.log('Client created! waiting for client to be ready ...');
		client.ready(torrentReady);
	}

	catch(e) {
		console.log('Error creating torrent', e);
		io.emit('bad-torrent');
	}
}

function torrentReady() {
    console.log('Client ready :)');
	io.emit('torrent', torrentRepresentation());
	console.log('client:', client);
}

function simplifyFilesArray(files) {
	return files.map(function(file) {
		return {
			name: file.name,
			path: file.path,
			length: file.length
		};
	});
}

function torrentRepresentation() {
	return {
		url: url,
		name: client.torrent.name,
		comment: client.torrent.comment,
		infoHash: client.infoHash,
		files: simplifyFilesArray(client.files)
	};
}