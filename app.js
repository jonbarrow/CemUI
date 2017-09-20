const APP_VERSION = '2.1.1';

var electron = require('electron'),
	updater = require("electron-updater").autoUpdater,
	//electron_reload = require('electron-reload')(__dirname), // lmao super broke idek why this is here
	exec = require('child_process').exec,
	smm = require('smm-api'),
	ssl = require('ssl-root-cas').inject(),
    fs = require('fs-extra'),
	fs_o = require('original-fs'),
	fsmonitor = require('fsmonitor'),
	async = require('async'),
	XMLParser = require('pixl-xml'),
	ini = require('ini'),
	low = require('lowdb'),
	FileSync = require('lowdb/adapters/FileSync'),
	game_storage,
	settings_storage,
    path = require('path'),
	url = require('url'),
	tga2png = require('tga2png'),
	png2ico = require('png-to-ico'),
	jimp = require('jimp'),
	request = require('request'),
	ws = require('windows-shortcuts'),
	winston = require('winston'),
	notifications = electron.Notification,
	dialog = electron.dialog,
	shell = electron.shell,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain,
	app = electron.app;


const API_ROOT = 'http://cemui.com';
const DATA_ROOT = app.getPath('userData').replace(/\\/g, '/') + '/app_data/';

winston.emitErrs = true;
updater.autoDownload = false;

var logger = new (winston.Logger)({
	level: 'verbose',
    transports: [
      	new winston.transports.Console({ colorize: true }),
      	new (winston.transports.File)({
      		colorize: false,
      		json: false,
      		filename: 'cemui.error.log'
      	})
    ]
});

fs.ensureDirSync(DATA_ROOT + 'cache/images');
fs.ensureDirSync(DATA_ROOT + 'cache/json');
fs.ensureDirSync(DATA_ROOT + 'themes');
if (!fs.existsSync(DATA_ROOT + 'cache/json/games.json')) {
	fs.createFileSync(DATA_ROOT + 'cache/json/games.json');
}
if (!fs.existsSync(DATA_ROOT + 'cache/json/settings.json')) {
	fs.createFileSync(DATA_ROOT + 'cache/json/settings.json');
}

game_storage = low(new FileSync(DATA_ROOT + 'cache/json/games.json'));
game_storage.defaults({games: []}).write();
settings_storage = low(new FileSync(DATA_ROOT + 'cache/json/settings.json'));
settings_storage.defaults({cemu_paths: [], game_paths: [], theme: 'Fluent'}).write();

updater.on('checking-for-update', () => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'checking',
		message: 'Checking for update...'
	})
  	console.log('Checking for update...');
})
updater.on('update-available', (info) => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'available',
		message: 'Update available'
	});

	if (notifications.isSupported()) {
		var notification = new notifications({
			title: 'Update Available',
			body: info.releaseName + '\nClick here to start update.'
		});
		notification.show();

		notification.on('click', (event) => {
			ApplicationWindow.webContents.send('update_status', {
				type: 'notification_clicked_start',
				message: info.releaseName
			});
		});
	}
})
updater.on('update-not-available', (info) => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'unavailable',
		message: 'Update not available'
	})
  	console.log('Update not available.');
})
updater.on('error', (error) => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'error',
		message: error
	})
	logger.log('error', error);
  	console.log('Error in auto-updater.');
})
updater.on('download-progress', (progress) => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'progress',
		progress: progress
	})
})
updater.on('update-downloaded', (info) => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'completed',
		message: 'Update downloaded'
	})
  	console.log('Update downloaded');
});

let ApplicationWindow;

let dns_errors = 0;

function applyUpdate() {
	updater.quitAndInstall();
}

function downloadUpdate() {
	updater.downloadUpdate();
}

function checkForUpdate() {
	updater.checkForUpdates();
}

function createWindow(file) {
  	ApplicationWindow = new BrowserWindow({
		icon: './ico.png',
		minHeight: 561,
  		minWidth: 837
	});

	ApplicationWindow.setMenu(null);
	ApplicationWindow.maximize();
	  
	ApplicationWindow.webContents.on('did-finish-load', () => {
        ApplicationWindow.show();
		ApplicationWindow.focus();
    });

  	ApplicationWindow.loadURL(url.format({
  		pathname: path.join(__dirname, '/app/' + settings_storage.get('theme').value() + '/' + file + '.html'),
    	protocol: 'file:',
    	slashes: true
  	}));
	
	ApplicationWindow.on('closed', () => {
    	ApplicationWindow = null;
	});
}

app.on('ready', function() {
	updater.checkForUpdates()
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
});

ipcMain.on('open_dev', () => {
	ApplicationWindow.webContents.openDevTools(); // debug stuff
});

ipcMain.on('check_for_update', checkForUpdate);
ipcMain.on('download_update', downloadUpdate);
ipcMain.on('apply_update', applyUpdate);

ipcMain.on('init', () => {
	init();
});

ipcMain.on('create_emulator_instance', (name, cemu_path) => {
	var cemu_object = {};
	if (!name) return ApplicationWindow.webContents.send('add_cemu_error', {type: 'missing', value: 'name'});
	if (!path) return ApplicationWindow.webContents.send('add_cemu_error', {type: 'missing', value: 'path'});
	if (settings_storage.get('cemu_paths').find({ name: name }).value()) return ApplicationWindow.webContents.send('add_cemu_error', {type: 'taken', value: 'name'});
	if (settings_storage.get('cemu_paths').find({ cemu_path: cemu_path }).value()) return ApplicationWindow.webContents.send('add_cemu_error', {type: 'taken', value: 'path'});

	cemu_object.name = name;

	cemu_path = cemu_path.replace(/\\/g, '/');
	cemu_object.cemu_path = cemu_path;

	cemu_path = cemu_path.split('/');
	cemu_path.pop();
	cemu_object.cemu_folder_path = cemu_path.join('/');

	settings_storage.get('cemu_paths').push(cemu_object).write();
	ApplicationWindow.webContents.send('cemu_folder_added');
})

ipcMain.on('load_cemu_folder', () => {
	var cemu_path = pickEmuFolder(),
		cemu_object = {name: 'Default'};

	cemu_path = cemu_path.replace(/\\/g, '/');
	cemu_object.cemu_path = cemu_path;

	cemu_path = cemu_path.split('/');
	cemu_path.pop();
	cemu_object.cemu_folder_path = cemu_path.join('/');

	settings_storage.get('cemu_paths').push(cemu_object).write();
	ApplicationWindow.webContents.send('cemu_folder_loaded');
});

ipcMain.on('load_games_folder', () => {
	var game_path = pickGameFolder();

	ApplicationWindow.webContents.send('game_folder_loading');

	loadGames(game_path, () => {
		settings_storage.get('game_paths').push(game_path).write();
		ApplicationWindow.webContents.send('games_folder_loaded');
	});
});

ipcMain.on('play_rom', (event, data) => {
	var game = game_storage.get('games').find({title_id: data.rom}).value(),
		game_path;
	if (game.is_wud) {
		game_path = game.path;
	} else {
		game_path = game.path + '/code/' + game.rom;
	}

	exec('"' + settings_storage.get('cemu_paths').find({name: data.emu}).value().cemu_path + '" -g ' + '"' + game_path + '"', (error, stdout, stderr) => {
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

ipcMain.on('make_shortcut', (event, data) => {
	createShortcut(data.emu, data.rom);
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

ipcMain.on('update_game_settings', (event, data) => {
	var id = data.rom.toLowerCase().replace('-', ''),
		settings = data.settings,
		valid_games = game_storage.get('games').filter({title_id: data.rom}).value();
	
	for (var i=0;i<valid_games.length;i++) {
		var game = valid_games[i];
		game_storage.get('games').find({path: game.path}).set('settings', settings).write();
	}
	
	fs.writeFileSync(settings_storage.get('cemu_paths').find({name: data.emu}).value().cemu_folder_path + '/gameProfiles/' + id + '.ini', ini.encode(settings));
})

function init() {

	var screenGames = false,
		screenCemu = false,
		screenWelcome = false;

	if (!settings_storage.get('cemu_paths').value() || settings_storage.get('cemu_paths').value().length < 1) {
		settings_storage.set('cemu_paths', []).write();
		screenCemu = true;
		console.log('cemu')
	}

	if (!settings_storage.get('game_paths').value() || settings_storage.get('game_paths').value().length < 1) {
		settings_storage.set('game_paths', []).write();
		screenGames = true;
		console.log('games')
	}
    
    if (screenCemu || screenGames || screenWelcome) {
		console.log('NEED TO OPEN MODALS');
        ApplicationWindow.webContents.send('show_screen', {games: screenGames, cemu: screenCemu, welcome: screenWelcome});
        return;
    }

	verifyGames(() => {
		async.each(settings_storage.get('game_paths').value(), (game_path, callback) => {
			loadGames(game_path, () => {
				callback();
			});
		}, (error) => {
			var games = game_storage.get('games').value(),
				most_played = getMostPlayed(games);
			
			getSuggested(most_played, (error, suggested) => {
				if (error) throw error;
				ApplicationWindow.webContents.send('emulator_list', settings_storage.get('cemu_paths').value());
				ApplicationWindow.webContents.send('init_complete', {library: games, most_played: most_played, suggested: suggested});
			});
		})
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
	request(API_ROOT + '/api/v2/GetSuggested/' + genres.join('|'), (error, response, body) => {
		if (error) return cb(null, {});
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

						console.log('new game found', file)
			
						if (path.extname(dir + '/' + file) == '.wud' || path.extname(dir + '/' + file) == '.wux') {
							is_wud = true;
						}
						cb(null, is_wud);
					},
					function(is_wud, cb) {
						request(API_ROOT, (error, response, body) => {
							if (error) {
								console.log(error)
								return cb('dns');
							} else {
								return cb(null, is_wud);
							}
						})
					},
					function(is_wud, cb) {
						try {
							if (!is_wud) {
								if (fs.pathExistsSync(dir + '/' + file + '/meta/meta.xml')) {
									var xml = XMLParser.parse(dir + '/' + file + '/meta/meta.xml');
								} else {
									var xml = XMLParser.parse(dir + '/' + file + '/code/app.xml');
								}
							}
						} catch (error) {
							console.log(error)
							return cb(true);
						}
						
						
						if (!is_wud) {
							if (!xml || !xml.title_id) {
								console.log('no title id')
								return cb(true);
							}
						}

						cb(null, is_wud);
					},
					function(is_wud, cb) {
						var name = file;
						getGameData(dir + '/' + file, is_wud, (error, data) => {
							if (error) {
								console.log(error)
								return cb(true);
							}

							cb(null, data, name, is_wud);
						});
					},
					function(data, name, is_wud, cb) {
						fs.ensureDirSync(DATA_ROOT + 'cache/images/' + data.game_title_id);
						data.screenshots_list = [];
						if (data.game_screenshot_urls && data.game_screenshot_urls !== '' && data.game_screenshot_urls !== 'null') {
							fs.ensureDirSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots');
							var urls = data.game_screenshot_urls.split('|');
							async.each(urls, (url, sc_callback) => {
								var req = request(url);

								req.on('error', (error) => {
									console.log(error)
									return sc_callback(url);
								});
								
								req.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + urls.indexOf(url) + '.jpg'))
								.on('error', (error) => {
									console.log(error)
									return sc_callback(url);
								})
								.on('close', () => {
									console.log('finished', url);
									data.screenshots_list.push(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + urls.indexOf(url) + '.jpg');
									sc_callback(null);
								});
							}, (error) => {
								if (error) {
									console.log('error on', error);
								  	return cb(true);
								} else {
									return cb(null, data, name, is_wud);
								}
							});
							/*for (var j=0;j<urls.length;j++) {
								var iteration = 0;
								var req = request(urls[j]);

								req.on('error', (error) => {
									console.log(urls[j], error)
									return cb(true);
								});
								
								req.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + j + '.jpg'))
								.on('close', () => {
									data.screenshots_list.push(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + iteration + '.jpg');
									iteration++;
									if (iteration == urls.length) {
										return cb(null, data, name, is_wud);
									}
								});								
							}*/
						} else {
							return cb(null, data, name, is_wud);
						}
						
					},
					function(data, name, is_wud, cb) {
						if (data.game_boxart_url && data.game_boxart_url !== '') {
							request(data.game_boxart_url)
								.on('error', () => {
									return cb(true);
								})
								.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/box.jpg'))
								.on('error', () => {
									return cb(true);
								})
								.on('close', () => {
									return cb(null, data, name, is_wud)
								});
						} else {
							fs.createReadStream('./defaults/box.jpg')
								.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/box.jpg'));
							
							return cb(null, data, name, is_wud);
						}
						
					},
					function(data, name, is_wud, cb) {
						if (!is_wud) {
							if (fs.pathExistsSync(dir + '/' + name + '/meta/iconTex.tga')) {
								tga2png(dir + '/' + name + '/meta/iconTex.tga').then(buffer=> {
									png2ico(buffer).then((buffer) => {
										fs.writeFileSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico', buffer);
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
								.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg'))
								.on('error', (error) => {
									console.log(error)
									return cb(true);
								})
								.on('close', () => {
									jimp.read(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg', (error, icon) => {
										if (error) {
											console.log(error);
											return cb(true);
										}
										icon.write(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png', (error) => {
											if (error) {
												console.log(error);
												return cb(true);
											}
											fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg');
	
											png2ico(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png').then((buffer) => {
												fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png');
												fs.writeFileSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico', buffer);
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
									.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico'));
								
								cb(null, data, name, is_wud);
							}
							
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
							.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg'))
							.on('error', (error) => {
								console.log(error)
								return cb(true);
							})
							.on('close', () => {
								jimp.read(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg', (error, icon) => {
									if (error) {
										console.log(error);
										return cb(true);
									}
									icon.write(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png', (error) => {
										if (error) {
											console.log(error);
											return cb(true);
										}
										fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg');

										png2ico(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png').then((buffer) => {
											fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png');
											fs.writeFileSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico', buffer);
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
								.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico'));
							
							cb(null, data, name, is_wud);
						}
					},
					function(data, name, is_wud, cb) {
						if (data.game_grid_image_url) {
							request(data.game_grid_image_url)
							.on('error', () => {
								return cb(true);
							})
							.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/grid.webp'))
							.on('error', () => {
								return cb(true);
							})
							.on('close', () => {
								return cb(null, data, name, is_wud)
							});
						} else {
							fs.createReadStream('./defaults/grid.jpg')
								.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/grid.webp'));
							
							cb(null, data, name, is_wud);
						}
					}
				], function(error, data, name, is_wud) {
					if (error) {
						if (error == 'dns') {
							dns_errors++;
						}
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
						boxart: DATA_ROOT + 'cache/images/' + data.game_title_id + '/box.jpg',
						icon: DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico',
						grid: DATA_ROOT + 'cache/images/' + data.game_title_id + '/grid.webp',
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
						description: data.game_overview,
						settings: {
							Graphics: {
								accurateShaderMul: true,
								disableGPUFence: false,
								GPUBufferCacheAccuracy: 0
							},
							CPU: {
								cpuTimer: 'cycleCounter',
								emulateSinglePrecision: false
							},
							Audio: {
								disableAudio: false
							}
						}
					}
					
					game_storage.get('games').push(game_data).write();

					callback(null);
				});
			} else {
				callback(null);
			}
		}, (error) => {
			if (dns_errors >=1) {
				dialog.showMessageBox({
					type: 'question',
					message: 'Could not download data for ' + dns_errors + ' game(s). API failure.'
			  	});
			}
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
	if (path.extname(game_path) == '.wud' || path.extname(game_path) == '.wux') return true;

	var stats = fs.lstatSync(game_path);
	if (!stats) return false;

	if (stats.isSymbolicLink()) {
		var link = fs.readlinkSync(game_path),
			subfolders = fs.readdirSync(link);
		if (subfolders.contains('code') && subfolders.contains('content')) {
			if (subfolders.contains('meta') && fs.pathExistsSync(game_path + '/meta/meta.xml')) {
				var rom = fs.readdirSync(game_path + '/code').filter(/./.test, /\.rpx$/i);
				if (!rom || rom.length < 0) return false;
			} else if (fs.pathExistsSync(game_path + '/code/app.xml')) {
				var rom = fs.readdirSync(game_path + '/code').filter(/./.test, /\.rpx$/i);
				if (!rom || rom.length < 0) return false;
			} else return false;
		} else return false;
	} else if (stats.isDirectory()) {
		var subfolders = fs.readdirSync(game_path);
		if (subfolders.contains('code') && subfolders.contains('content')) {
			if (subfolders.contains('meta') && fs.pathExistsSync(game_path + '/meta/meta.xml')) {
				var rom = fs.readdirSync(game_path + '/code').filter(/./.test, /\.rpx$/i);
				if (!rom || rom.length < 0) return false;
			} else if (fs.pathExistsSync(game_path + '/code/app.xml')) {
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
		if (fs.pathExistsSync(game_path + '/meta/meta.xml')) {
			xml = XMLParser.parse(game_path + '/meta/meta.xml');
		} else {
			xml = XMLParser.parse(game_path + '/code/app.xml');
		}
		
		post_type = 'title_id';
		post_code = [xml.title_id._Data.slice(0, 8), '-', xml.title_id._Data.slice(8)].join('');
	}

	request(API_ROOT + '/api/v2/GetGame/' + post_type + '/' + post_code, (error, response, body) => {
		body = JSON.parse(body);
		if (!body || body.error) return callback(true);
		return callback(null, body)
	})
}

function getProductCode(file, cb) {

	var fd = fs.openSync(file, 'r'),
		buffer = new Buffer(10);

	if (path.extname(file) == '.wux') {
		productCode = fs.readSync(fd, buffer, 0, 10, 0x2F0000);
	} else {
		productCode = fs.readSync(fd, buffer, 0, 10, 0);
	}
	return buffer.toString('utf8', 0, productCode);
}

function createShortcut(emulator, id) {
	/*
	God I fucking hate Node support for lnk files, and lnk files in general. 00050000-10143500
	*/
	var game = game_storage.get('games').find({ title_id: id }).value(),
		cemu = settings_storage.get('cemu_paths').find({name: emulator}).value().cemu_path,
		rom;
	if (!game) return;

	if (game.is_wud) {
		rom = game.path;
	} else {
		rom = game.path + '/code/' + game.rom;
	}

	ws.create(require('os').homedir() + '/Desktop/' + game.name_clean + ' (' + emulator + ').lnk', {
		target : cemu,
		args: '-g "' + rom + '"',
		icon: DATA_ROOT + 'cache/images/' + id + '/icon.ico',
		iconIndex: '0',
		runStyle : ws.MIN
	}, (error) => {
		if (error) {
			throw Error(error);
		}
	});
}

Array.prototype.contains = function(el) {
    return this.indexOf(el) > -1;
}