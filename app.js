var electron = require('electron'),
	electron_reload = require('electron-reload')(__dirname),
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
    dialog = electron.dialog,
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
		ApplicationWindow.webContents.openDevTools(); // debug stuff
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
})

function init() {
	fs.ensureDirSync(path.join(__dirname, '/cache/images'));
	fs.ensureDirSync(path.join(__dirname, '/cache/json'));
	if (!fs.existsSync(path.join(__dirname, '/cache/json/games.json'))) {
		fs.createFileSync(path.join(__dirname, '/cache/json/games.json'));
	}
	if (!fs.existsSync(path.join(__dirname, '/cache/json/settings.json'))) {
		fs.createFileSync(path.join(__dirname, '/cache/json/settings.json'));
	}
	game_storage = low(new FileSync(path.join(__dirname, '/cache/json/games.json')));
	game_storage.defaults({games: []}).write();
	settings_storage = low(new FileSync(path.join(__dirname, '/cache/json/settings.json')));
	settings_storage.defaults({}).write();

	if (!settings_storage.get('cemu_path').value()) {
		settings_storage.set('cemu_path', pickEmuFolder()).write();
	}

	if (!settings_storage.get('games_path').value()) {
		settings_storage.set('games_path', pickGameFolder()).write();
	}

	loadGames(settings_storage.get('games_path').value());
}

function loadGames(dir) {
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
						if (data.game_screenshot_urls && data.game_screenshot_urls !== '') {
							fs.ensureDirSync(path.join(__dirname, '/cache/images/' + data.game_title_id + '/screenshots'));
							var urls = data.game_screenshot_urls.split('|');
							for (var j=0;j<urls.length;j++) {
								var iteration = 0;
								request(urls[j])
									.on('error', () => {
										return cb(true);
									})
									.pipe(fs.createWriteStream(path.join(__dirname, '/cache/images/' + data.game_title_id + '/screenshots/' + j + '.jpg')))
									.on('error', () => {
										return cb(true);
									})
									.on('close', () => {
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
								.pipe(fs.createWriteStream(path.join(__dirname, '/cache/images/' + data.game_title_id + '/box.jpg')))
								.on('error', () => {
									return cb(true);
								})
								.on('close', () => {
									cb(null, data, name, is_wud)
								});
						} else {
							fs.createReadStream('./defaults/box.jpg')
								.pipe(fs.createWriteStream(path.join(__dirname, '/cache/images/' + data.game_title_id + '/box.jpg')));
							
							cb(null, data, name, is_wud);
						}
						
					},
					function(data, name, is_wud, cb) {
						if (!is_wud) {
							tga2png(dir + '/' + name + '/meta/iconTex.tga').then(buffer=> {
								png2ico(buffer).then((buffer) => {
									fs.writeFileSync(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.ico'), buffer);
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
							.pipe(fs.createWriteStream(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.jpg')))
							.on('error', (error) => {
								console.log(error)
								return cb(true);
							})
							.on('close', () => {
								jimp.read(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.jpg'), (error, icon) => {
									if (error) {
										console.log(error);
										return cb(true);
									}
									icon.write(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.png'), (error) => {
										if (error) {
											console.log(error);
											return cb(true);
										}
										fs.removeSync(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.jpg'));

										png2ico(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.png')).then((buffer) => {
											fs.removeSync(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.png'));
											fs.writeFileSync(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.ico'), buffer);
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
								.pipe(fs.createWriteStream(path.join(__dirname, '/cache/images/' + data.game_title_id + '/icon.ico')));
							
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
						is_wud: is_wud,
						title_id: data.game_title_id,
						product_code: data.game_product_code,
						path: dir + '/' + name,
						rom: rom,
						name: data.game_title,
						name_clean: data.game_title_clean,
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
			if (error) return;

			ApplicationWindow.webContents.send('init_complete', game_storage.get('games').value());
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

Array.prototype.contains = function(el) {
    return this.indexOf(el) > -1;
}