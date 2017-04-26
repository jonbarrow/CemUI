'use strict';

//////////////////////////////////////////////////////////////////
///                                                            ///
///                        Dependencies                        ///
///                                                            ///
//////////////////////////////////////////////////////////////////

var electron      = require('electron'),
	fs            = require('fs'),
	exec          = require('child_process').exec,
	dns           = require('dns'),
	path          = require('path'),
	url           = require('url'),
	XMLParser     = require('pixl-xml'),
	async         = require('async'),
	Stopwatch     = require("timer-stopwatch"),
	decompress    = require('decompress-zip'),
	request       = require('request').defaults({ encoding: null }),
	Entities      = require('html-entities').AllHtmlEntities,
	entities      = new Entities(),
	dialog        = electron.dialog,
	BrowserWindow = electron.BrowserWindow,
	ipcMain       = electron.ipcMain,
	app           = electron.app;

var user_settings = {};

user_settings["is_dark"] = false;
user_settings["display_mode"] = 'box';

app.setName("Cemu Manager");

let ApplicationWindow; // Main application window

function createWindow(file) { // Creates window from file
  	ApplicationWindow = new BrowserWindow({
  		icon: './ico.png',
  		titleBarStyle: 'hidden', // Borderless
  		frame: false             // Borderless
  	});
  	ApplicationWindow.loadURL(url.format({ // Makes the window
  		pathname: path.join(__dirname, '/data/app/'+file+'.html'),
  		//pathname: path.join(__dirname, '/data/app/test.html'),
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

ipcMain.on('change_folder', function(event, data) {
	switch(data) {
		case 'cemu':
			var settings = JSON.parse(fs.readFileSync('data/cache/settings.json')),
				emulators = JSON.parse(fs.readFileSync('data/cache/emulators.json'));

			var cemu_folder_path = pickEmuFolder(); // Popup for the Cemu folder

			settings["cemu_folder_path"] = cemu_folder_path[0];

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
			    fs.writeFile('data/cache/settings.json', JSON.stringify(settings), function(error) {
				    if (error) {
				        console.log(error);
				    }
				    var result = dialog.showMessageBox({
					  	type: 'question',
					  	message: 'Setting changed. Restart required, Would you like to restart now?',
					  	buttons: ['Yes', 'No']
					});

					if (result == 0) {
						ApplicationWindow.loadURL(url.format({
						    pathname: path.join(__dirname, '/data/app/index.html'), // Opens the application to load Cemu
						    protocol: 'file:',
						    slashes: true
						}))
					}
				});
			});
			break;
		case 'game':

			ApplicationWindow.loadURL(url.format({
			    pathname: path.join(__dirname, '/data/app/load_new_games.html'),
			    protocol: 'file:',
			    slashes: true
			}));

			var settings = JSON.parse(fs.readFileSync('data/cache/settings.json')),
				game_folder_path = pickGameFolder(),
				games = [],
				game_errors = [];

			settings["game_folder_path"] = game_folder_path[0];

			var gameDirs = getDirectories(game_folder_path[0]);
			async.forEachOf(gameDirs, function (game_index, i, callback) {

				var gamePath = game_folder_path+"\\"+game_index;
		    	if (!isGame(gamePath)) {
			    	callback();
			    	return;
				}

				loadGameData(gamePath, game_index, function (err, result) {
					if (err && !result) {
						console.log("ERROR");
						callback();
						return;
					}
					games.push(result);
					callback();
				});
				
			}, function () {
				fs.writeFileSync('data/cache/settings.json', JSON.stringify(settings));
			    fs.writeFile('data/cache/games.json', JSON.stringify(games), function(error) {
				    if (error) {
				        return console.log(error);
				    }
				    var result = dialog.showMessageBox({
					  	type: 'question',
					  	message: 'Setting changed. Restart required, Would you like to restart now?',
					  	buttons: ['Yes', 'No']
					});

					if (result == 0) {
						ApplicationWindow.loadURL(url.format({
						    pathname: path.join(__dirname, '/data/app/index.html'),
						    protocol: 'file:',
						    slashes: true
						}))
					}
				});
			});
		break;
	}
});


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
	var settings = JSON.parse(fs.readFileSync('data/cache/settings.json')),
		emulators = JSON.parse(fs.readFileSync('data/cache/emulators.json')),
		emulator_keys = Object.keys(emulators),
		emulators_list = "",
		games = JSON.parse(fs.readFileSync('data/cache/games.json')),
		game_keys = Object.keys(games),
		game_list = [];

	user_settings['game_folder_path'] = settings['cemu_folder_path'];
	user_settings['cemu_folder_path'] = settings['cemu_folder_path'];

	for (var e = emulator_keys.length - 1; e >= 0; e--) {
		emulators_list += '<a class="dropdown-item launch" launch-with="'+emulator_keys[e]+'" href="#">'+emulator_keys[e]+'</a>\n';
  	}
  	for (var g = game_keys.length - 1; g >= 0; g--) {
		game_list.push(games[game_keys[g]]);
  	}
  	if (settings["is_dark"]) {
  		event.sender.send("dark_theme");
  	}
  	var i = 0,
  		games_directory = getDirectories(settings["game_folder_path"]);
  	for (var j = 0; j < games_directory.length; j++) {
  		if (isGame(settings["game_folder_path"]+'\\'+games_directory[j])) {
  			i++;
  		}
  	}

  	if (game_list.length < i) {
  		var result = dialog.showMessageBox({
		  	type: 'question',
		  	message: 'Found ' + (i - games.length) + ' new game(s) in your games folder. Would you like to download the data now?',
		  	buttons: ['Yes', 'No']
		});

		if (result == 0) {
			var valid_paths = [];
			for (var k = 0; k < game_list.length; k++) {
				valid_paths.push(game_list[k]["folder"].replace(/\\/g, "/"));
			}
			for (var k = 0; k < games_directory.length; k++) {
				if (valid_paths.indexOf(settings["game_folder_path"].replace(/\\/g,"/")+'/'+games_directory[k]) < 0 && isGame(settings["game_folder_path"]+'\\'+games_directory[k])) {

					ApplicationWindow.loadURL(url.format({
					    pathname: path.join(__dirname, '/data/app/load_new_games.html'),
					    protocol: 'file:',
					    slashes: true
					}));
					loadGameData(settings["game_folder_path"]+'\\'+games_directory[k], games_directory[k], function (err, result) {
						if (err && !result) {
							console.log("ERROR");
							return;
						}
						console.log('Error with '+settings["game_folder_path"].replace(/\\/g,"/")+'/'+games_directory[k]);
						game_list.push(result);
						fs.writeFileSync('data/cache/games.json', JSON.stringify(game_list));
						ApplicationWindow.loadURL(url.format({
						    pathname: path.join(__dirname, '/data/app/index.html'),
						    protocol: 'file:',
						    slashes: true
						}));
					});
				}
			}
		}
  	}
  	if (game_list.length > i) {
  		for (var i = 0; i < game_list.length; i++) {
  			try {
				fs.statSync(game_list[i]['path']);
			} catch(e) {
				game_list.splice(i, 1);
			}
  		}
  		fs.writeFile('data/cache/games.json', JSON.stringify(game_list), function(error) { // Saves the games object to a file
		    if (error) {
		        return console.log(error);
		    }
		});
		dialog.showMessageBox({
		  	type: 'info',
		  	message: (games.length - i) + ' game(s) were removed from the games folder. Their data has been removed. Game list updated, display order of games may have changed as a result.'
		});
  	}

  	event.sender.send("games_emulators_loaded", {game_list:game_list, emulator_list: emulators_list, display:settings['display_mode'], settings:settings});
});


ipcMain.on('load_game_folder', function(event) {
	var game_folder_path = pickGameFolder(), // Popup for the game folder
		games = [], // Object storing the games
		game_errors = []; // Object storing errors

	user_settings["game_folder_path"] = game_folder_path[0];

	event.sender.send("game_folder_loading");

	var gameDirs = getDirectories(game_folder_path[0]); // Gets the files/dirs in the game folder

	async.forEachOf(gameDirs, function (game_index, i, callback) {

		var gamePath = game_folder_path+"\\"+game_index;
    	if (!isGame(gamePath)) { // verifies that it's a game
	    	callback();
	    	return;
		}

		loadGameData(gamePath, game_index, function (err, result) {
			if (err && !result) {
				console.log("ERROR");
				callback();
				return;
			}
			games.push(result);
			callback();
		});
		
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

	user_settings["cemu_folder_path"] = cemu_folder_path[0];

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
	    fs.writeFile('data/cache/settings.json', JSON.stringify(user_settings), function(error) {
		    if (error) {
		        console.log(error);
		    }
		    event.sender.send("cemu_folder_loaded", cemu); // Done
		});
	});
});

ipcMain.on('load_main_window', function(event, data) {
	ApplicationWindow.loadURL(url.format({
	    pathname: path.join(__dirname, '/data/app/index.html'), // Opens main window normally
	    protocol: 'file:',
	    slashes: true
	}));
});

ipcMain.on('change_theme', function(event, data) {
	var settings  = JSON.parse(fs.readFileSync('data/cache/settings.json'));
	if (data == 'dark') {
		settings['is_dark'] = true;
		user_settings['is_dark'] = true;
	} else {
		settings['is_dark'] = false;
		user_settings['is_dark'] = false;
	}
	fs.writeFile('data/cache/settings.json', JSON.stringify(settings), function(error) {
	    if (error) {
	        console.log(error);
	    }
	    event.sender.send("theme_changed", data); // Done
	});
});

ipcMain.on('change_display', function(event, display) {
	var game_list = JSON.parse(fs.readFileSync('data/cache/games.json')),
		emulators_list = JSON.parse(fs.readFileSync('data/cache/emulators.json')),
		settings  = JSON.parse(fs.readFileSync('data/cache/settings.json'));
	settings['display_mode'] = display;
	fs.writeFile('data/cache/settings.json', JSON.stringify(settings), function(error) {
	    if (error) {
	        console.log(error);
	    }
	    event.sender.send("display_changed", {game_list:game_list, emulator_list: emulators_list, display:display}); // Done
	});
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
	  	var games = JSON.parse(fs.readFileSync('data/cache/games.json'));

	  	var stopwatch = new Stopwatch();
		stopwatch.start();

	  	exec('"'+emulator["exe_path"]+'" '+emulator["params"]+' '+'"'+game+'"', (error, stdout, stderr) => {
	  	// Launch game with the emulator and params
		  	if (error) {
			    console.error(error);
			    return;
		  	}

		  	stopwatch.stop();
		  	console.log("Played game for "+stopwatch.ms / 1000.0+" seconds.");
		  	console.log("Played game for "+stopwatch.ms+" milliseconds.");

			for (var i = games.length - 1; i >= 0; i--) {
				if (games[i]['path'] == game) {
					var current_time = games[i]['play_time'],
						new_time = current_time += stopwatch.ms;
					games[i]['play_time'] = new_time;
					fs.writeFileSync('data/cache/games.json', JSON.stringify(games));
					event.sender.send("update_play_time", {new_time:new_time,game_path:game});
					break;
				}
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
	if (typeof subDirs === undefined || subDirs.length < 0) {
	    return false;
	}

	if (Object.values(subDirs).indexOf('code') <= -1 || Object.values(subDirs).indexOf('content') <= -1 || Object.values(subDirs).indexOf('meta') <= -1) {
		return false;
	}

	var codeFile = fs.readdirSync(folder+"\\code").filter(/./.test, /\.rpx$/i);

	if (!codeFile || codeFile.length < 0) {
		return false;
	}

	if (!fs.existsSync(folder+"\\meta\\meta.xml")) {
		return false;
	}

	return true;
}



function loadGameData(gamePath, name, cb) {

	var files = fs.readdirSync(gamePath+"\\code"), // scans code dir
		rom   = files.filter(/./.test, /\.rpx$/i)[0]; // finds the rpx file

	var game = {}; // new key in the games object

	async.waterfall([
		function(callback) {
			var xml = XMLParser.parse(gamePath+"\\meta\\meta.xml");

			if (!xml || typeof xml["title_id"] == 'undefined' || typeof xml["longname_en"] == 'undefined' || xml["longname_en"] === '') {
				game["invalid"]     = 'true';
				game["title"]       = 'Invalid Game';
				game["path"]        = gamePath+"\\code\\"+rom;
				game["folder"]      = gamePath;
				game["platform"]    = "Unknown";
		  		game["releaseDate"] = "Unknown";
		  		game["overview"]    = "The game located at `"+gamePath+"` was found to be invalid or corrupted. This is caused by CemuManager not being able to find the required meta tags for the game. This issue is generally caused by a blank/incomplete/invalid `meta.xml` file. If a game is not in english, this will also occur (CemuManager only officially supports english titles). As such, this game has been flagged as invalid, and will not run properly. The `Launch` button has been disabled. If you believe this to be an error please report it at https://github.com/RedDuckss/CemuManager/issues";
		  		game["ESRB"]        = "Unknown";
		  		game["players"]     = "Unknown";
		  		game["coop"]        = "Unknown";
		  		game["publisher"]   = "Unknown";
		  		game["developer"]   = "Unknown";
		  		game["background"]  = "data:png;base64," + base64_encode(path.join(__dirname, './cemumanagerlogo.png'));
		  		game["image"]       = "data:png;base64," + base64_encode(path.join(__dirname, './WiiU-box-generic.png'));

			    callback(true, game);
			} else {
				game["path"] = gamePath+"\\code\\"+rom; // Sets the full path to the game
				game["folder"] = gamePath;
				callback(null, xml);
			}
		},
	    function(xml, callback) {
	        checkConnection('217.182.215.49', function(isConnected) {
	        	if (!isConnected) {
					dialog.showMessageBox({
					  	type: 'question',
					  	message: 'Failed to connect to API when downloading data for '+name+'. Switching to offline placeholders.'
					});
					//game["title"] = xml["longname_en"]["_Data"];
					game["platform"]    = "Unknown";
			  		game["releaseDate"] = "Unknown";
			  		game["overview"]    = "An overview for this game cannot be displayed. This is because an overview/description could not be properly downloaded for found for this game.";
			  		game["ESRB"]        = "Unknown";
			  		game["players"]     = "Unknown";
			  		game["coop"]        = "Unknown";
			  		game["publisher"]   = "Unknown";
			  		game["developer"]   = "Unknown";
			  		game["background"]  = "data:png;base64," + base64_encode(path.join(__dirname, './cemumanagerlogo.png'));
			  		game["image"]       = "data:png;base64," + base64_encode(path.join(__dirname, './WiiU-box-generic.png'));

			  		callback(true, game);
				} else {
					callback(null, xml);
				}
	        })
	    },
	    function(xml, callback) {
	    	var title_id = [xml["title_id"]["_Data"].slice(0, 8), '-', xml["title_id"]["_Data"].slice(8)].join('');
	    	request.get('http://217.182.215.49/api/GetGame/?title_id='+title_id, function (error, response, body) {
				if (error) {
		    		callback(true);
		    	}
		    	if (response.statusCode != 200) {
		    		callback(true);
		    	}

		    	var data = JSON.parse(body.toString());
		    	if (data['error']) {
		    		callback(true);
		    	}

		    	callback(null, data);
			});
	    },
	    function(data, callback) {
	    	if (!data['game_boxart_url'].trim()) {
		    	game["image"] = "data:png;base64," + base64_encode(path.join(__dirname, './WiiU-box-generic.png'));
		    	callback(null, data);
		    } else {
		    	request.get(data['game_boxart_url'], function (error, response, body) { // Pulls game data from online API
					if (error) {
			    		callback(true);
			    	}
			    	if (response.statusCode != 200) {
			    		callback(true);
			    	}

			    	var image_data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'); // base64
				    game["image"] = image_data; // stores the base64 for offline use

				    callback(null, data);
				});
		    }
	    },  function(data, callback) {
	    	if (!data['game_background_url'].trim()) {
		    	game["background"] = "data:png;base64," + base64_encode(path.join(__dirname, './cemumanagerlogo.png'));
		    	callback(null, data);
		    } else {
		    	request.get(data['game_background_url'], function (error, response, body) { // Pulls game data from online API
					if (error) {
			    		callback(true);
			    	}
			    	if (response.statusCode != 200) {
			    		callback(true);
			    	}

			    	var image_data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'); // base64
				    game["background"] = image_data; // stores the base64 for offline use

				    callback(null, data);
				});
		    }
	    }, function(data, callback) {

    		game["title"]       = entities.encode(data['game_title'].toString()),
    		game["play_time"]   = 0,
	  		game["releaseDate"] = entities.encode(data['game_release_date'].toString()),
	  		game["overview"]    = entities.encode(data['game_overview'].toString()),
	  		game["ESRB"]        = entities.encode(data['game_esrb'].toString()),
	  		game["players"]     = entities.encode(data['game_max_players'].toString()),
	  		game["coop"]        = entities.encode(data['game_coop'].toString()),
	  		game["publisher"]   = entities.encode(data['game_publisher'].toString()),
	  		game["developer"]   = entities.encode(data['game_developer'].toString());

	    	callback(null, game);
	    }
	], cb );

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

function checkConnection(url, cb) {
    dns.lookupService(url,80,function(err) {
        if (err && err.code == "ENOTFOUND") {
            cb(false);
        } else {
            cb(true);
        }
    })
}

function isGamePath(path) {
	var settings = JSON.parse(fs.readFileSync('data/cache/settings.json')),
		folders = getDirectories(settings["game_folder_path"]);
	for (var i = 0; i < folders.length; i++) {
		console.log(settings["game_folder_path"]+"\\"+folders[i]);
	}
    return false;
}


function base64_encode(path) {
    return new Buffer(fs.readFileSync(path)).toString('base64');
}