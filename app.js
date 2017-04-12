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
	Stopwatch     = require("timer-stopwatch"),
	decompress    = require('decompress-zip'),
	csvtojson     = require('csvtojson'),
	request       = require('request').defaults({ encoding: null }),
	Entities      = require('html-entities').AllHtmlEntities,
	entities      = new Entities(),
	dialog        = electron.dialog,
	BrowserWindow = electron.BrowserWindow,
	ipcMain       = electron.ipcMain,
	app           = electron.app;


let ApplicationWindow; // Main application window

function createWindow(file) { // Creates window from file
  	ApplicationWindow = new BrowserWindow({
  		icon: './ico.png',
  		titleBarStyle: 'hidden', // Borderless
  		frame: false             // Borderless
  	});
  	ApplicationWindow.loadURL(url.format({ // Makes the window
  		pathname: path.join(__dirname, '/data/app/'+file+'.html'),
    	protocol: 'file:',
    	slashes: true
  	}));
  	//ApplicationWindow.webContents.openDevTools()
  	ApplicationWindow.on('closed', () => {
    	ApplicationWindow = null; // Clear the variable when the window closes
  	});
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
	// Button in the top right
	if (!ApplicationWindow.isMaximized()) {
 		ApplicationWindow.maximize();
 	} else {
 		ApplicationWindow.unmaximize();
 	}
});
ipcMain.on('btn-window-option-close', function(event, data) {
	ApplicationWindow.close();    // Button in the top right
});

ipcMain.on('load_all_games_emulators', function(event, data) {
	var emulators = JSON.parse(fs.readFileSync('data/cache/emulators.json')),
		emulator_keys = Object.keys(emulators),
		emulators_list = "",
		games = JSON.parse(fs.readFileSync('data/cache/games.json')),
		game_keys = Object.keys(games),
		game_list = [];
	for (var e = emulator_keys.length - 1; e >= 0; e--) {
		emulators_list += '<a class="dropdown-item launch" launch-with="'+emulator_keys[e]+'" href="#">'+emulator_keys[e]+'</a>\n';
  	}
  	for (var g = game_keys.length - 1; g >= 0; g--) {
		game_list.push(games[game_keys[g]]);
  	}
  	event.sender.send("games_emulators_loaded", {game_list:game_list, emulator_list: emulators_list});
});


ipcMain.on('load_game_folder', function(event) {
	var game_folder_path = pickGameFolder(), // Popup for the game folder
		games = []; // Object storing the games

	event.sender.send("game_folder_loading");

	var gameDirs = getDirectories(game_folder_path[0]); // Gets the files/dirs in the game folder

	async.forEachOf(gameDirs, function (result, i, callback) {
	    var gamePath = game_folder_path[0]+"\\"+result;
	    if (isGame(gamePath)) { // verifies that it's a game
	    	var files = fs.readdirSync(gamePath+"\\code"), // scans code dir
				rom   = files.filter(/./.test, /\.rpx$/i)[0]; // finds the rpx file

			var meta = fs.readFileSync(gamePath+"\\meta\\meta.xml"); // Reads the meta file for later

			parseString(meta, function (error, result) { // Parses the meta file
		  		var name = result["menu"]["longname_en"][0]["_"].replace(/\n/g, ' ').replace(/[^a-z0-9 ]/gi,''), // Gets the name (probably wont work on other languages)
		  		title_id = [result["menu"]["title_id"][0]["_"].slice(0, 8), '-', result["menu"]["title_id"][0]["_"].slice(8)].join('');

		  		//console.log(title_id);

				var game = {}; // new key in the games object
				game["title"] = result["menu"]["longname_en"][0]["_"], // Sets the game title
				game["path"] = gamePath+"\\code\\"+rom; // Sets the full path to the game

				var csv = fs.readFileSync(path.join(__dirname, './games.csv')).toString();

				csvtojson().fromString(csv).on('csv',(csvRow) => {
					if (csvRow[0] == title_id) {
						game["Region"] = csvRow[4];
						game["CoverArtURL"] = csvRow[5];
					}
				})
				.on('done', () => {
				    request.get(game["CoverArtURL"], function (error, response, body) {
				    	if (error) {
				    		callback();
				    		return console.log(error);
				    	}
				    	if (response.statusCode != 200) {
				    		callback();
				    		return console.log(response.statusCode);
				    	}
				    	var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'); // base64
						
						game["image"] = data; // stores the base64 for offline use
						request.get('http://thegamesdb.net/api/GetGame.php?name='+name, function (error, response, body) { // Pulls game data from online API
							if (!error && response.statusCode == 200) {
								parseString(body.toString(), function (error, result) {
									var id          = result["Data"]["Game"][0]["id"][0],          // Game ID
							  			platform    = result["Data"]["Game"][0]["Platform"][0],    // Game Platform
							  			releaseDate = result["Data"]["Game"][0]["ReleaseDate"][0], // Game ReleaseDate
							  			overview    = result["Data"]["Game"][0]["Overview"][0],    // Game Overview
							  			players     = result["Data"]["Game"][0]["Players"][0],     // Game Players
							  			coop        = result["Data"]["Game"][0]["Co-op"][0],       // Game Co-op
							  			publisher   = result["Data"]["Game"][0]["Publisher"][0],   // Game Publisher
							  			developer   = result["Data"]["Game"][0]["Developer"][0],   // Game Developer
							  			rating      = result["Data"]["Game"][0]["Rating"][0];      // Game Rating

							  		if (typeof result["Data"]["Game"][0]["ESRB"][0] !== 'undefined') { // Game ESRB
							  			var ESRB = result["Data"]["Game"][0]["ESRB"][0];
							  		} else {
							  			var ESRB = result["Data"]["Game"][1]["ESRB"][0];
							  		}

							  		game["platform"]    = entities.encode(platform.toString()),
							  		game["releaseDate"] = entities.encode(releaseDate.toString()),
							  		game["overview"]    = entities.encode(overview.toString()),
							  		game["ESRB"]        = entities.encode(ESRB.toString()),
							  		game["players"]     = entities.encode(players.toString()),
							  		game["coop"]        = entities.encode(coop.toString()),
							  		game["publisher"]   = entities.encode(publisher.toString()),
							  		game["developer"]   = entities.encode(developer.toString()),
							  		game["rating"]      = entities.encode(rating.toString());

							  		if (typeof result["Data"]["Game"][0]["Images"][0]["screenshot"] !== 'undefined') {
							  			var bg = result["Data"]["Game"][0]["Images"][0]["screenshot"][0]["original"][0]["_"];
							  		} else {
							  			var bg = result["Data"]["Game"][1]["Images"][0]["screenshot"][0]["original"][0]["_"];
							  		}

							  		request.get('http://thegamesdb.net/banners/'+bg, function (error, response, body) {
									    if (!error && response.statusCode == 200) {
									        var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'); // base64
									        game["background"] = data; // stores the base64 for offline use

									        games.push(game);
									        callback(); // ONWARD
									    } else {
									    	console.log(error);
									    	callback();
									    }
									});
								});
							} else {
						    	console.log(error);
						    	callback();
						    }
						})
				    });
				})
			});
		} else callback();
	}, function () {
	    fs.writeFile('data/cache/games.json', JSON.stringify(games), function(error) { // Saves the games object to a file
		    if (error) {
		        return console.log(error);
		    }
		    event.sender.send("game_folder_loaded", {game_path:game_folder_path[0]}); // Tells application we're done
		});
	});
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

	  	var stopwatch = new Stopwatch();
		stopwatch.start();

	  	exec('"'+emulator["exe_path"]+'" '+emulator["params"]+' '+'"'+game+'"', (error, stdout, stderr) => {
	  	// Launch game with the emulator and params
		  	if (error) {
			    console.error(error);
			    return;
		  	}
		  	console.log("Played game for "+stopwatch.ms / 1000.0+" seconds.");
			stopwatch.stop();
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
	var gameFolder = dialog.showOpenDialog({
		properties: ['openDirectory']});

	if (!gameFolder) {
		return pickGameFolder();
	}
	return gameFolder;
}
function pickEmuFolder() { // Picks dir
	var emuFolder = dialog.showOpenDialog({
		properties: ['openDirectory']});

	if (!emuFolder) {
		return pickEmuFolder();
	}
	return emuFolder;
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
