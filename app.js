var electron = require('electron'),
	//electron_reload = require('electron-reload')(__dirname), // lmao super broke idek why this is here
	exec = require('child_process').exec,
	smm = require('smm-api'),
	ssl = require('ssl-root-cas').inject(),
    fs = require('fs-extra'),
	fs_o = require('original-fs'),
	fsmonitor = require('fsmonitor'),
	async = require('async'),
	XMLParser = require('pixl-xml'),
	low = require('lowdb'),
	FileSync = require('lowdb/adapters/FileSync'),
	game_storage,
    path = require('path'),
	url = require('url'),
	tga2png = require('tga2png'),
	png2ico = require('png-to-ico'),
	jimp = require('jimp'),
	request = require('request'),
	shortcut = require('win-shortcut'),
    ws = require('windows-shortcuts'),
	dialog = electron.dialog,
	shell = electron.shell,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain,
	app = electron.app;

let ApplicationWindow;

function createWindow(file) {
  	ApplicationWindow = new BrowserWindow({
		icon: './ico.png',
		minHeight: 600,
  		minWidth: 400
	});

	ApplicationWindow.setMenu(null);
	ApplicationWindow.maximize();
	  
	ApplicationWindow.webContents.on('did-finish-load', () => {
        ApplicationWindow.show();
		ApplicationWindow.focus();
		//ApplicationWindow.webContents.openDevTools(); // debug stuff
    });

  	ApplicationWindow.loadURL(url.format({
  		pathname: path.join(__dirname, '/app/'+file+'.html'),
    	protocol: 'file:',
    	slashes: true
  	}));
	
	ApplicationWindow.on('closed', () => {
    	ApplicationWindow = null;
	});
}

app.on('ready', function() {
    createWindow('index');
	ApplicationWindow.webContents.on('new-window', function(event, url) {
  		event.preventDefault();
	  	electron.shell.openExternal(url);
	});
})

app.on('window-all-closed', () => {
  	if (process.platform !== 'darwin') {
    	app.quit(); // OSX shit
  	}
})

ipcMain.on('init', () => {
	init();
});

ipcMain.on('load_cemu_folder', () => {
	settings_storage.set('cemu_path', pickEmuFolder()).write();
	ApplicationWindow.webContents.send('cemu_folder_loaded');
});

ipcMain.on('load_games_folder', () => {
	var g_path = pickGameFolder();
	ApplicationWindow.webContents.send('game_folder_loading');
	loadGames(g_path, () => {
		settings_storage.set('games_path', g_path).write();
		ApplicationWindow.webContents.send('games_folder_loaded');
	});
});

ipcMain.on('play_rom', (event, id) => {
	var game = game_storage.get('games').find({title_id: id}).value(),
		game_path;
	if (game.is_wud) {
		game_path = game.path;
	} else {
		game_path = game.path + '/code/' + game.rom;
	}

	console.log(game_path);

	exec('"' + settings_storage.get('cemu_path').value() + '" -g ' + '"' + game_path + '"', (error, stdout, stderr) => {
		if (error) {
			console.error(error);
			return;
		}

		game_storage.get('games').find(game).set('plays', game.plays+=1).write();
	  });
});

ipcMain.on('show_rom', (event, id) => {
	var game = game_storage.get('games').find({title_id: id}).value();
	if (game.is_wud) {
		shell.showItemInFolder(game.rom);
	} else {
		shell.openItem(game.path);
	}
})

ipcMain.on('make_shortcut', (event, id) => {
	createShortcut(id);
});

ipcMain.on('set_favorite', (event, id) => {
	game_storage.get('games').find({title_id: id}).set('is_favorite', true).write();
});

ipcMain.on('remove_favorite', (event, id) => {
	game_storage.get('games').find({title_id: id}).set('is_favorite', false).write();
});

ipcMain.on('smm_search_courses', (event, data) => {
	data.order = 'uploaded';
	data.limit = 50;
	smm.searchCourses(data, (error, courses) => {
		if (error) throw error;
		console.log(courses);
	});
});

function init() {
	fs.ensureDirSync('cache/images');
	fs.ensureDirSync('cache/json');
	if (!fs.existsSync('cache/json/games.json')) {
		fs.createFileSync('cache/json/games.json');
	}
	if (!fs.existsSync('cache/json/settings.json')) {
		fs.createFileSync('cache/json/settings.json');
	}
	game_storage = low(new FileSync('cache/json/games.json'));
	game_storage.defaults({games: []}).write();
	settings_storage = low(new FileSync('cache/json/settings.json'));
	settings_storage.defaults({}).write();

	if (!settings_storage.get('cemu_path').value()) {
		ApplicationWindow.webContents.send('show_screen', {cemu: true});
		return;
	}

	if (!settings_storage.get('games_path').value()) {
		ApplicationWindow.webContents.send('show_screen', {games: true});
		return;
	}

	if (!game_storage.get('games').value() || game_storage.get('games').value().length <= 0) {
		ApplicationWindow.webContents.send('show_screen', {games: true});
		return;
	}

	verifyGames(() => {
		loadGames(settings_storage.get('games_path').value(), () => {
			var games = game_storage.get('games').value(),
				most_played = getMostPlayed(games);
			
			getSuggested(most_played, (error, suggested) => {
				if (error) throw error;
				ApplicationWindow.webContents.send('init_complete', {library: games, most_played: most_played, suggested: suggested});
			});
		});
	});
}

function getMostPlayed(values) {
	var sorted = [];
	values.sort(function (a, b) {
		return a.plays - b.plays;
	});
	return values.reverse().slice(0, 4);
}

function getSuggested(most_played, cb) {
	var genres = [];
	for (var i=most_played.length-1;i>=0;i--) {
		genres.push(most_played[i].genres[Math.floor(Math.random() * most_played[i].genres.length)]);
	}
	request('http://104.236.44.105/api/GetSuggested/?genres=' + genres.join('|'), (error, response, body) => {
		body = JSON.parse(body);
		if (error || response.statusCode !== 200 || !body || body.error) return callback(true);
		return cb(null, body);
	});
}

function verifyGames(cb) {
	var games = game_storage.get('games').value();
	for (var i=games.length-1;i>=0;i--) {
		var game = games[i],
			pathToCheck;
		if (game.is_wud) {
			pathToCheck = game.rom;
		} else {
			pathToCheck = game.path + '/code/' + game.rom;
		}

		if (!fs.existsSync(pathToCheck)) {
			game_storage.get('games').remove(game).write();
		}
	}

	return cb();
}

function loadGames(dir, master_callback) {
	fs.readdir(dir, (error, files) => {
		if (error) throw error;

		async.each(files, (file, callback) => {
			if (isGame(dir + '/' + file)) {
				async.waterfall([
					function(cb) {
						var test = game_storage.get('games').find({ path: dir + '/' + file }).value(),
							is_wud = false;
						if (test) {
							return cb(true);
						}
			
						if (path.extname(dir + '/' + file) == '.wud') {
							is_wud = true;
						}
						cb(null, is_wud);
					},
					function(is_wud, cb) {
						try {
							if (!is_wud) {
								var xml = XMLParser.parse(dir + '/' + file + '/meta/meta.xml');
							}
						} catch (error) {
							return cb(true);
						}
						
						
						if (!is_wud) {
							if (!xml || !xml.title_id) {
								return cb(true);
							}
						}

						cb(null, is_wud);
					},
					function(is_wud, cb) {
						var name = file;
						getGameData(dir + '/' + file, is_wud, (error, data) => {
							if (error) {
								return cb(true);
							}

							cb(null, data, name, is_wud);
						});
					},
					function(data, name, is_wud, cb) {
						data.screenshots_list = [];
						if (data.game_screenshot_urls && data.game_screenshot_urls !== '') {
							fs.ensureDirSync('cache/images/' + data.game_title_id + '/screenshots');
							var urls = data.game_screenshot_urls.split('|');
							for (var j=0;j<urls.length;j++) {
								var iteration = 0;
								request(urls[j])
									.on('error', () => {
										return cb(true);
									})
									.pipe(fs.createWriteStream('cache/images/' + data.game_title_id + '/screenshots/' + j + '.jpg'))
									.on('error', () => {
										return cb(true);
									})
									.on('close', () => {
										data.screenshots_list.push('cache/images/' + data.game_title_id + '/screenshots/' + iteration + '.jpg');
										iteration++;
										if (iteration == urls.length) {
											cb(null, data, name, is_wud);
										}
									});								
							}
						} else {
							cb(null, data, name, is_wud);
						}
						
					},
					function(data, name, is_wud, cb) {
						if (data.game_boxart_url && data.game_boxart_url !== '') {
							request(data.game_boxart_url)
								.on('error', () => {
									return cb(true);
								})
								.pipe(fs.createWriteStream('cache/images/' + data.game_title_id + '/box.jpg'))
								.on('error', () => {
									return cb(true);
								})
								.on('close', () => {
									cb(null, data, name, is_wud)
								});
						} else {
							fs.createReadStream('./defaults/box.jpg')
								.pipe(fs.createWriteStream('cache/images/' + data.game_title_id + '/box.jpg'));
							
							cb(null, data, name, is_wud);
						}
						
					},
					function(data, name, is_wud, cb) {
						if (!is_wud) {
							tga2png(dir + '/' + name + '/meta/iconTex.tga').then(buffer=> {
								png2ico(buffer).then((buffer) => {
									fs.writeFileSync('cache/images/' + data.game_title_id + '/icon.ico', buffer);
									cb(null, data, name, is_wud);
								}).catch(() => {
									return cb(true);
								});
							}, (error) => {
								return cb(true);
							});
						} else if (data.game_icon_url) {
							request({
								rejectUnauthorized: false,
								url: data.game_icon_url,
								method: "GET"
							})
							.on('error', (error) => {
								console.log(error)
								return cb(true);
							})
							.pipe(fs.createWriteStream('cache/images/' + data.game_title_id + '/icon.jpg'))
							.on('error', (error) => {
								console.log(error)
								return cb(true);
							})
							.on('close', () => {
								jimp.read('cache/images/' + data.game_title_id + '/icon.jpg', (error, icon) => {
									if (error) {
										console.log(error);
										return cb(true);
									}
									icon.write('cache/images/' + data.game_title_id + '/icon.png', (error) => {
										if (error) {
											console.log(error);
											return cb(true);
										}
										fs.removeSync('cache/images/' + data.game_title_id + '/icon.jpg');

										png2ico('cache/images/' + data.game_title_id + '/icon.png').then((buffer) => {
											fs.removeSync('cache/images/' + data.game_title_id + '/icon.png');
											fs.writeFileSync('cache/images/' + data.game_title_id + '/icon.ico', buffer);
											cb(null, data, name, is_wud);
										}).catch((error) => {
											console.log(error)
											return cb(true);
										});
									});
								})
							});
						} else {
							console.log('No icon found for ' + data.game_title + '. Defaulting to default icon')
							fs.createReadStream('./defaults/icon.ico')
								.pipe(fs.createWriteStream('cache/images/' + data.game_title_id + '/icon.ico'));
							
							cb(null, data, name, is_wud);
						}
					}
				], function(error, data, name, is_wud) {
					if (error) {
						return callback(null);
					}

					var rom;
					if (is_wud) {
						rom = dir + '/' + name;
					} else {
						rom = fs.readdirSync(dir + '/' + name + '/code').filter(/./.test, /\.rpx$/i)[0];
					}

					var game_data = {
						is_favorite: false,
						plays: 0,
						is_wud: is_wud,
						title_id: data.game_title_id,
						product_code: data.game_product_code,
						path: dir + '/' + name,
						rom: rom,
						name: data.game_title,
						name_clean: data.game_title_clean,
						screenshots: data.screenshots_list,
						genres: data.game_genres.split('|'),
						release_date: data.game_release_date,
						publisher: data.game_publisher,
						developer: data.game_developer,
						region: data.game_region,
						release_region: data.game_release_region,
						rating: data.game_esrb,
						max_players: data.game_max_player,
						co_op: data.game_coop,
						description: data.game_overview
					}
					
					game_storage.get('games').push(game_data).write();

					callback(null);
				});
			} else {
				callback(null);
			}
		}, (error) => {
			if (error) return master_callback(true);
			return master_callback(null);

			/*fsmonitor.watch(settings_storage.get('games_path').value(), null, (event) => {
				if (event.addedFiles || event.addedFolders) {
					console.log(event)
				}
				if (event.removedFiles || event.removedFolders) {
					checkInvalidGames();
				}
			})*/
		});
	});
}

function pickGameFolder() {
	var gameFolder = dialog.showOpenDialog({
		title: 'Select your games folder',
		message: 'Select your games folder',
		properties: ['openDirectory']
	});

	if (!gameFolder) {
		return pickGameFolder();
	}
	return gameFolder[0];
}
function pickEmuFolder() {
	var emuFolder = dialog.showOpenDialog({
		title: 'Select your Cemu executable',
		message: 'Select your Cemu executable',
		properties: ['openFile'],
		filters: [
			{name: 'All Executables', extensions: ['exe']}
		]
	});

	if (!emuFolder) {
		return pickEmuFolder();
	}
	return emuFolder[0];
}

function isGame(game_path) {
	if (path.extname(game_path) == '.wud') return true;

	var stats = fs.lstatSync(game_path);
	if (!stats) return false;

	if (stats.isDirectory()) {
		var subfolders = fs.readdirSync(game_path);
		if (subfolders.contains('code') && subfolders.contains('content') && subfolders.contains('meta')) {
			if (fs.pathExistsSync(game_path + '/meta/meta.xml')) {
				var rom = fs.readdirSync(game_path + '/code').filter(/./.test, /\.rpx$/i);
				if (!rom || rom.length < 0) return false;
			} else return false;
		} else return false;
	} else return false;

	return true;
}

function getGameData(game_path, is_wud, callback) {
	var game_data = {},
		post_code, post_type, xml;
	if (is_wud) {
		post_type = 'product_code';
		post_code = getProductCode(game_path);
	} else {
		xml = XMLParser.parse(game_path + '/meta/meta.xml');
		post_type = 'title_id';
		post_code = [xml.title_id._Data.slice(0, 8), '-', xml.title_id._Data.slice(8)].join('');
	}

	request('http://104.236.44.105/api/GetGame/?' + post_type + '=' + post_code, (error, response, body) => {
		body = JSON.parse(body);
		if (!body || body.error) return callback(true);
		return callback(null, body)
	})
}

function getProductCode(file, cb) {
	var fd = fs.openSync(file, 'r'),
		buffer = new Buffer(10),
		productCode = fs.readSync(fd, buffer, 0, 10, 0);
	return buffer.toString('utf8', 0, productCode);
}

function createShortcut(id) {
	/*
	God I fucking hate Node support for lnk files, and lnk files in general. 00050000-10143500
	*/
	var game = game_storage.get('games').find({ title_id: id }).value(),
		cemu = settings_storage.get('cemu_path').value();
	if (!game) return;
	shortcut.create({
		target_file: cemu,
		target_folder: require('os').homedir() + '/Desktop',
		title: game.name_clean,
		icon: __dirname + '/cache/images/' + id + '/icon.ico'
	}, (error) => {
		if (error) {
			throw error;
		}
		var rom;
		if (game.is_wud) {
			rom = game.path;
		} else {
			rom = game.path + '/code/' + game.rom;
		}
		ws.edit(require('os').homedir() + '/Desktop/' + game.name_clean + '.lnk', {
			args: '-g "' + rom + '"'
		}, () => {
			console.log('d')
		});
	})
}

Array.prototype.contains = function(el) {
    return this.indexOf(el) > -1;
}