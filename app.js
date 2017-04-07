'use strict';

//////////////////////////////////////////////////////////////////
///                                                            ///
///                        Dependencies                        ///
///                                                            ///
//////////////////////////////////////////////////////////////////

var electron      = require('electron'),
	fs            = require('fs'),
	exec          = require('child_process').exec,
	path          = require('path'),
	url           = require('url'),
	parseString   = require('xml2js').parseString,
	async         = require('async'),
	decompress    = require('decompress-zip'),
	request       = require('request').defaults({ encoding: null }),
	dialog        = electron.dialog,
	BrowserWindow = electron.BrowserWindow,
	ipcMain       = electron.ipcMain,
	app           = electron.app;


let ApplicationWindow; // Main application window

function createWindow(file) { // Creates window from file
  	ApplicationWindow = new BrowserWindow({
  		titleBarStyle: 'hidden', // Borderless
  		frame: false             // Borderless
  	});

  	ApplicationWindow.loadURL(url.format({ // Makes the window
  		pathname: path.join(__dirname, '/data/app/'+file+'.html'),
    	protocol: 'file:',
    	slashes: true
  	}));
  	ApplicationWindow.on('closed', () => {
    	ApplicationWindow = null; // Clear the variable when the window closes
  	})
}

app.on('ready', function() {
	generalLoad(); // Load things when the app is ready
})

app.on('window-all-closed', () => {
  	if (process.platform !== 'darwin') {
    	app.quit(); // OSX shit
  	}
})

app.on('activate', () => {
  	if (ApplicationWindow === null) {
    	createWindow('index'); // Makes window if one doesn't exist
  	}
})


ipcMain.on('btn-window-option-minimize', function(event, data) {
	ApplicationWindow.minimize(); // Button in the top right
});
ipcMain.on('btn-window-option-maximize', function(event, data) {
	ApplicationWindow.maximize(); // Button in the top right
});
ipcMain.on('btn-window-option-close', function(event, data) {
	ApplicationWindow.close();    // Button in the top right
});


ipcMain.on('load_game_folder', function(event) {
	var game_folder_path = pickGameFolder(), // Popup for the game folder
		games = {}; // Object storing the games

	var gameDirs = getDirectories(game_folder_path[0]); // Gets the files/dirs in the game folder
	for(var g = 0, len = gameDirs.length; g < len; g++) { // Loop em
		async.waterfall([ // Splash
			function(callback) {
				var gamePath = game_folder_path+"\\"+gameDirs[g]; // Full game path
				if (isGame(gamePath)) { // verifies that it's a game
		  			var files = fs.readdirSync(gamePath+"\\code"), // scans code dir
						rom   = files.filter(/./.test, /\.rpx$/i)[0]; // finds the rpx file
					callback(null, gamePath, rom); // ONWARD
		  		}
			},
		    function(gamePath, rom, callback) {
		    	fs.readFile(gamePath+"\\meta\\meta.xml", function (error, data) { // Reads the meta file for later
				  	if (error) {
				    	return console.log(error);
				  	}
				  	callback(null, data, gamePath, rom); // ONWARD
				});
		    },
		    function(data, gamePath, rom, callback) {
		        parseString(data, function (error, result) { // Parses the meta file
			  		var name = result["menu"]["longname_en"][0]["_"].replace(/\n/g, ' ').replace(/[^a-z0-9 ]/gi,''); // Gets the name (probably wont work on other languages)

					games[name] = {}, // new key in the games object
					games[name]["title"] = result["menu"]["longname_en"][0]["_"], // Sets the game title
					games[name]["path"] = gamePath+"\\code\\"+rom; // Sets the full path to the game
		        	callback(null, name, gamePath); // ONWARD
				});
		    },
		    function(name, gamePath, callback) {
		        request.get('http://thegamesdb.net/api/GetGame.php?name='+name, function (error, response, body) { // Pulls game data from online API
				    if (!error && response.statusCode == 200) {
				        callback(null, name, body.toString()); // ONWARD
				    }
				});
		    },
		    function(name, data, callback) {
		        parseString(data, function (error, result) { // Parses the response from the request (is XML)
			  		var id = result["Data"]["Game"][0]["id"][0]; // Game ID
		        	callback(null, name, id); // ONWARD
				});
		    },
		    function(name, id, callback) {
		    	// Gets the box art
		        request.get('http://thegamesdb.net/banners/_gameviewcache/boxart/original/front/'+id+'-1.jpg', function (error, response, body) { 
				    if (!error && response.statusCode == 200) {
				        var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'); // base64
				        games[name]["image"] = data; // stores the base64 for offline use
				        callback(null, games); // ONWARD
				    }
				});
		    }
		], function (err, result) {
		  	fs.writeFile('data/cache/games.json', JSON.stringify(result), function(error) { // Saves the games object to a file
			    if (error) {
			        console.log(error);
			    }
			});
		});
	}
	event.sender.send("game_folder_loaded", {game_path:game_folder_path[0]}); // Tells application we're done
});

ipcMain.on('load_window_cemu_load', function(event, data) {
	ApplicationWindow.loadURL(url.format({
	    pathname: path.join(__dirname, '/data/app/load_cemu.html'), // Opens the application to load Cemu
	    protocol: 'file:',
	    slashes: true
	}))
});

ipcMain.on('load_cemu_folder', function(event) {

	var cemu_folder_path = pickEmuFolder(); // Popup for the Cemu folder

	if (!fs.existsSync(cemu_folder_path[0]+'/dbghelp.dll')) { // Checks if  you have cemuhook
		var result = dialog.showMessageBox({
		  	type: 'question',
		  	message: 'Cemuhook not found. Would you like to download the latest version now?',
		  	buttons: ['Yes', 'No']
		});

		if (result == 0) {
			downloadFile("https://files.sshnuke.net/cemuhook_174d_0403.zip", cemu_folder_path[0]);
			// Is there a better way to do this besides scraping the site or hard-coding?
		}
	}

	var files = fs.readdirSync(cemu_folder_path[0]), // Scans Cemu folder
		executable = files.filter(/./.test, /\.exe$/i)[0]; // Finds the exe (could be renamed)

	var cemu = {folder_path: cemu_folder_path[0], exe_path: cemu_folder_path[0]+"\\"+executable, params: "-g"}; // makes emulator object
	fs.writeFile('data/cache/emulators.json', JSON.stringify({"cemu": cemu}), function(error) {
		// Saves it as `cemu` (More emulators can be added with their own options. Cemu is default)
	    if (error) {
	        console.log(error);
	    }
	    event.sender.send("cemu_folder_loaded", cemu); // Done
	});
	
});

ipcMain.on('load_main_window', function(event, data) {
	ApplicationWindow.loadURL(url.format({
	    pathname: path.join(__dirname, '/data/app/index.html'), // Opens main window normally
	    protocol: 'file:',
	    slashes: true
	}));
});

ipcMain.on('launch_game_rom', function(event, data) {
	var emulator = data.emulator, // Which emulator to launch
		game     = data.rom; // Which game is it

	fs.readFile("data/cache/emulators.json", function (error, json) { // Read the emulators file
	  	if (error) {
	    	return console.log(error);
	  	}
	  	json = JSON.parse(json.toString()); // Parse the shit
	  	emulator = json[emulator]; // Grab the emulator object

	  	exec('"'+emulator["exe_path"]+'" '+emulator["params"]+' '+'"'+game+'"', (error, stdout, stderr) => {
	  	// Launch game with the emulator and params
		  	if (error) {
			    console.error(error);
			    return;
		  	}
		});
	});
});



function generalLoad() {
	fs.stat("data", function (err, stats) { // is `data` a thing?
  		if (err) {
  			createDirectory("data"); // Nope! make it.
	  	}
	});
	fs.stat("data/cache", function (err, stats) { // is `data/cache` a thing?
  		if (err) {
  			createDirectory("data/cache"); // Nope! make it.
	  	}
	});
	fs.stat("data/app", function (err, stats) { // is `data/app` a thing (it should be idk how it wouldn't)?
  		if (err) {
  			createDirectory("data/app"); // Nope! make it.
	  	}
	});
	if (!fs.existsSync('data/cache/emulators.json')) { // Is there an emualtors file? 
		createWindow('load_game_folder'); // Nope! Lets run the set up then!
	} else {
		createWindow('index'); // Yes! Run as normal, set up must have been done.
	}
}
function createDirectory(path) { // Makes dirs
	fs.mkdir(path, function() {
		console.log("Created `"+path+"` folder");
	});
}
function pickGameFolder() { // Picks dir
	return dialog.showOpenDialog({
	    properties: ['openDirectory']
	});
}
function pickEmuFolder() { // Picks dir
	return dialog.showOpenDialog({
	    properties: ['openDirectory']
	});
}
function loadGame(game) {
	// Currently unused. Will use later
}
function loadEmulator(path) {
	// Currently unused. Will use later
}
function getDirectories(src) {  // Gets dirs
  	return fs.readdirSync(src).filter(file => fs.statSync(path.join(src, file)).isDirectory());
}
function isGame(folder) { // Checks if it's a game or not
	var subDirs = getDirectories(folder);
	if (subDirs === undefined || subDirs.length == 0) {
	    return false;
	}
	if (subDirs["code"] === null || subDirs["content"] === null || subDirs["meta"] === null) {
		return false;
	}
	return true;
}

function downloadFile(url, target) { // I hope you understand this without me saying (PS, it downloads files)
    var req = request({
        method: 'GET',
        uri: url
    });

    var out = fs.createWriteStream(target+"/cemuhook.zip");
    req.pipe(out);

    req.on('end', function() {
        unzip(target+"/cemuhook.zip", target);
    });
}

function unzip(file, target) { // Unzips
	var unzip = new decompress(file);

	unzip.on('error', function (err) {
	    console.log('Caught an error', err);
	});
	unzip.on('extract', function (log) {
	    dialog.showMessageBox({
		  	type: 'question',
		  	message: 'Cemuhook finished extracting to `'+target+'`'
		});
	});
	unzip.extract({
	    path: target
	});
}