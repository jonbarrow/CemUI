const APP_VERSION = '2.3.0';
const CACHE_VERSION = 2;

let electron = require('electron'),
	updater = require("electron-updater").autoUpdater,
	electron_reload = require('electron-reload')(__dirname, {
		ignored: /node_modules|[\/\\]\.|cemui.log|cemui.error.log|cemui.info.log/
	}),
	NodeNUSRipper = require('./NodeNUSRipper.js'),
    NUSRipper = new NodeNUSRipper(),
	exec = require('child_process').exec,
	smm = require('smm-api'),
	smm_editor = require('cemu-smm'),
	fusejs = require('fuse.js'),
	unzip = require('unzip'),
	zipFolder = require('zip-folder'),
	archiver = require('archiver'),
	bl = require('bl'),
	ssl = require('ssl-root-cas').inject(),
    fs = require('fs-extra'),
	fsmonitor = require('fsmonitor'),
	async = require('async'),
	XMLParser = require('pixl-xml'),
	ini = require('ini'),
	low = require('lowdb'),
	FileSync = require('lowdb/adapters/FileSync'),
    path = require('path'),
	url = require('url'),
	tga2png = require('tga2png'),
	png2ico = require('png-to-ico'),
	jimp = require('jimp'),
	request = require('request'),
	ws = require('windows-shortcuts'),
	winston = require('winston'),
	Menu = electron.Menu,
	notifications = electron.Notification,
	dialog = electron.dialog,
	shell = electron.shell,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain,
	app = electron.app;

const context = [
    {
        label: 'Cemu Instances',
        submenu: [
        ]
	},
    {
        label: 'View',
        submenu: [
            {
                label: 'Reload',
                accelerator: 'CmdOrCtrl+R',
                click (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.reload();
                    }
                }
            },
            {
                label: 'Toggle Dev Tools',
                accelerator: 'Ctrl+Shift+I',
                click (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.webContents.toggleDevTools()
                    }
                }
            },
            { type: 'separator' },
            { role: 'resetzoom' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        role: 'help',
        submenu: [
			{
				label: 'CemUI Help Desk',
                click () {
                    shell.openExternal('https://github.com/RedDuckss/CemUI/wiki/FAQ-Help')
                }
			},
			{ type: 'separator' },
            {
                label: 'Cemu',
                click () {
                    shell.openExternal('http://cemu.info/')
                }
            },
            {
                label: 'CemUI',
                click () {
                    shell.openExternal('http://cemui.com/')
                }
            },
            {
                label: 'Cemu Compatibility List',
                click () {
                    shell.openExternal('http://compat.cemu.info/')
                }
            },
            {
                label: 'SMMDB',
                click () {
                    shell.openExternal('https://smmdb.ddns.net/')
                }
            },
            {
                label: 'Cemu Graphics Packs',
                click () {
                    shell.openExternal('https://github.com/slashiee/cemu_graphic_packs')
                }
            }
        ]
    }
]

let game_storage, settings_storage, ticket_cache_storage, fuse_searchable,
	context_menu;

const API_ROOT = 'http://cemui.com';
const DATA_ROOT = app.getPath('userData').replace(/\\/g, '/') + '/app_data/';
const GLOBAL_THEMES = [
	'Flux', 'Fluent', 'Metro', 'Switch',
	'_dlgames', '_smmdb'
];
const FUSE_OPTIONS = {
	shouldSort: true,
	tokenize: true,
	matchAllTokens: true,
	findAllMatches: true,
	threshold: 0.6,
	location: 0,
	distance: 100,
	keys: [
	  	'name'
  	]
};
const SMM_VALID_SAVE_PATHS = [
	'fe31b7f2',
	'44fc5929',
	'20660681'
];

let LOCAL_RESOURCES_ROOT;
if (fs.pathExistsSync('./resources')) {
	LOCAL_RESOURCES_ROOT = './resources';
} else {
	LOCAL_RESOURCES_ROOT = './';	
}

updater.autoDownload = false;

const logger = winston.createLogger({
	level: 'verbose',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.printf(log => {
			return `${log.timestamp} | ${log.level}: ${log.message}`;
		})
	),
    transports: [
      	new winston.transports.Console({ colorize: true }),
      	new winston.transports.File({
      		colorize: false,
      		json: false,
      		filename: 'cemui.log'
		}),
		new winston.transports.File({
			colorize: false,
			json: false,
			filename: 'cemui.error.log',
			level: 'error'
		}),
		new winston.transports.File({
			colorize: false,
			json: false,
			filename: 'cemui.info.log',
			level: 'info'
		})
    ]
});

setupDefaultFiles();

updater.on('checking-for-update', () => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'checking',
		message: 'Checking for update...'
	});
  	logger.log({
		level: 'info',
		message: 'Checking for update...'
	});
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
	logger.log({
		level: 'info',
		message: 'Update not available.'
	});
})
updater.on('error', (error) => {
	ApplicationWindow.webContents.send('update_status', {
		type: 'error',
		message: error
	})
	logger.log({
		level: 'error', 
		message: error
	});
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
  	logger.log({
		level: 'info',
		message: 'Update downloaded'
	});
});

NUSRipper.on('ticket_downloaded', (data) => {
	ApplicationWindow.webContents.send('ticket_downloaded', data);
});

NUSRipper.on('rom_decryption_missing', () => {
	ApplicationWindow.webContents.send('rom_decryption_missing');
});

ipcMain.on('rom_decryption_missing', () => {
	var cdecrypt_location = dialog.showOpenDialog({
		title: 'Select your CDecrypt executable',
		message: 'Select your CDecrypt executable',
		properties: ['openFile'],
		filters: [
			{name: 'CDecrypt.exe', extensions: ['exe']}
		]
	});

	if (!cdecrypt_location) {
		dialog.showMessageBox(ApplicationWindow, {
			type: 'error',
			title: 'CDecrypt Error',
			message: 'CDecrypt Not Set',
			detail: 'CDecrypt was not set. Games will not auto-decrypt',
			icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
		});
	} else {
		settings_storage.set('cdecrypt_location', cdecrypt_location[0]).write();
		NUSRipper.setCDecryptLocation(settings_storage.get('cdecrypt_location').value());
	}
});

NUSRipper.on('download_status', (data) => {
	ApplicationWindow.webContents.send('download_status', data);
});

NUSRipper.on('download_total_size', (data) => {
	ApplicationWindow.webContents.send('download_total_size', data);
	logger.log({
		level: 'info',
		message: 'Total download size for' + data.tid + ': ' + data.size
	});
});

NUSRipper.on('rom_decryption_started', (data) => {
	ApplicationWindow.webContents.send('rom_decryption_started', data);
});

NUSRipper.on('rom_decryption_completed', (data) => {
	ApplicationWindow.webContents.send('rom_decryption_completed', data);
});

let ApplicationWindow,
	update_cache_version = true;

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
  		minWidth: 837,
        webPreferences: {
            experimentalFeatures: true //for backdrop-filter css. if causes issues we will find an alternative.
        }
	});

	ApplicationWindow.setMenu(null);
	ApplicationWindow.maximize();
    
	ApplicationWindow.webContents.on('did-finish-load', () => {
        ApplicationWindow.show();
		ApplicationWindow.focus();
    });
	
	ApplicationWindow.on('closed', () => {
    	ApplicationWindow = null;
	});

	ApplicationWindow.webContents.on('new-window', function(event, url) {
		event.preventDefault();
		electron.shell.openExternal(url);
	});
}

function setWindow() {
	ApplicationWindow.loadURL(url.format({
		//pathname: path.join(__dirname, '/app/' + settings_storage.get('theme').value() + '/' + file + '.html'),
		pathname: path.join(__dirname, '/app/wrapper/index.html'),
		protocol: 'file:',
		slashes: true
	}));
	updateContextMenuCemuInstances();
}

app.on('ready', () => {
	updater.checkForUpdates();
	createWindow();
	verifyCacheVersion((response) => {
		if (response === 0) {
			clearCache();
			setupDefaults();
			app.relaunch();
			app.quit();
		} else {
			update_cache_version = false;
			setupDefaults();
			setWindow();
		}
	});
});

app.on('window-all-closed', () => {
  	if (process.platform !== 'darwin') {
    	app.quit(); // OSX shit
  	}
});

ipcMain.on('open_dev', () => {
	ApplicationWindow.webContents.openDevTools(); // debug stuff
});

ipcMain.on('controller_event', (event, data) => {
	ApplicationWindow.webContents.send('controller_event', data);
	switch (data.name) {
		case 'found':
			ApplicationWindow.webContents.send('controller_found', data.event);
			break;
		case 'button_press':
			ApplicationWindow.webContents.send('controller_button_press', data.event);
			break;
	
		default:
			break;
	}
});

ipcMain.on('theme_finished_loading', (event, data) => {
    logger.log({
		level: 'info',
		message: 'theme finished loading, closing loading screen'
	});
	ApplicationWindow.webContents.send('wrapper_close_loading');
});

ipcMain.on('open_menu', (event, data) => {
	ApplicationWindow.webContents.send('open_menu_wrapper');
});

ipcMain.on('check_for_update', checkForUpdate);
ipcMain.on('download_update', downloadUpdate);
ipcMain.on('apply_update', applyUpdate);

ipcMain.on('ask_for_theme', () => {
	let current_theme = settings_storage.get('theme').value(),
		theme_path, theme_name;

	if (GLOBAL_THEMES.contains(current_theme)) {
		theme_path = path.join('../', current_theme, 'index.html');
		theme_name = current_theme;
	} else {
		if (fs.pathExistsSync(path.join(DATA_ROOT, 'themes', current_theme, 'index.html'))) {
			theme_path = path.join(DATA_ROOT, 'themes', current_theme, 'index.html');
			theme_name = current_theme;
		} else {
			theme_path = '../Flux/index.html';
			theme_name = 'Flux';
		}
	}
	ApplicationWindow.webContents.send('theme_change', {
		name: theme_name,
		path: theme_path
	});
});

ipcMain.on('change_theme', (event, data) => {
	settings_storage.set('theme', data.name).write();
	let current_theme = settings_storage.get('theme').value(),
		theme_path, theme_name;

	if (GLOBAL_THEMES.contains(current_theme)) {
		theme_path = path.join('../', current_theme, 'index.html');
		theme_name = current_theme;
	} else {
		if (fs.pathExistsSync(path.join(DATA_ROOT, 'themes', current_theme, 'index.html'))) {
			theme_path = path.join(DATA_ROOT, 'themes', current_theme, 'index.html');
			theme_name = current_theme;
		} else {
			theme_path = '../Flux/index.html';
			theme_name = 'Flux';
		}
	}
	ApplicationWindow.webContents.send('theme_change', {
		name: theme_name,
		path: theme_path
	});
});

ipcMain.on('init', (event, data) => {
	if (data && data.page == '_dlgames') {
		// init for downloading games
		logger.log({
			level: 'info',
			message: 'Started ticket cache download'
		});
		NUSRipper.setTicketCacheLocation(settings_storage.get('ticket_cache_folder').value());
		NUSRipper.setTicketVendor(settings_storage.get('ticket_vendor').value());
		NUSRipper.setTicketCacheVendor(settings_storage.get('ticket_cache_vendor').value());
		NUSRipper.setCDecryptLocation(settings_storage.get('cdecrypt_location').value());

		NUSRipper.downloadTicketCache((data) => {
			//ticket_cache_storage = low(new FileSync(settings_storage.get('ticket_cache_folder').value() + '/_cache.json'));
			fuse_searchable = new fusejs(data, FUSE_OPTIONS);
			ApplicationWindow.webContents.send('ticket_cache_downloaded');
			logger.log({
				level: 'info',
				message: 'Ticket cache downloaded'
			});
		});
	} else if (data && data.page == '_smmdb') {
		// init for smmdb
	} else if (data && data.page == 'wrapper') {
		//wrapper screens init, sends screens
		sendThemes(getThemes());
        sendScreens();
    } else {
		//normal theme init, sends games
		sendThemes(getThemes());
		init();
	}	
});


ipcMain.on('load_cemu_folder', () => {
	var cemu_path = pickEmuFolder(),
		cemu_object = {name: 'Default'};

	if (!cemu_path) {
		ApplicationWindow.webContents.send('cemu_folder_loaded');
		return;
	}

	cemu_path = cemu_path.replace(/\\/g, '/');
	cemu_object.cemu_path = cemu_path;

	cemu_path = cemu_path.split('/');
	cemu_path.pop();
	cemu_object.cemu_folder_path = cemu_path.join('/');

	settings_storage.get('cemu_paths').push(cemu_object).write();
	ApplicationWindow.webContents.send('cemu_folder_loaded');
});
ipcMain.on('skip_cemu_folder', () => {
	ApplicationWindow.webContents.send('cemu_folder_loaded');
});

ipcMain.on('load_games_folder', () => {
	var game_path = pickGameFolder();

	if (!game_path) {
		ApplicationWindow.webContents.send('games_folder_loaded');
		return;
	}
	ApplicationWindow.webContents.send('game_folder_loading');

	if (!settings_storage.get('game_paths').value().contains(game_path)) {
		loadGames(game_path, () => {
			settings_storage.get('game_paths').push(game_path).write();
			ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
			ApplicationWindow.webContents.send('games_folder_loaded');
		});
	} else {
		ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
		ApplicationWindow.webContents.send('games_folder_loaded');
	}
});
ipcMain.on('add_new_game_folder', () => {
	var gameFolder = dialog.showOpenDialog({
		title: 'Select a games folder',
		message: 'Select a games folder',
		properties: ['openDirectory']
	});

	if (!gameFolder) {
		return;
	}
	let game_path = gameFolder[0];
	if (!settings_storage.get('game_paths').value().contains(game_path)) {
		loadGames(game_path, () => {
			settings_storage.get('game_paths').push(game_path).write();
			ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
		});
	} else {
		ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
	}
});
ipcMain.on('skip_games_folder', () => {
	ApplicationWindow.webContents.send('games_folder_loaded');
});

ipcMain.on('ask_for_emulator_list', () => {
	ApplicationWindow.webContents.send('emulator_list', settings_storage.get('cemu_paths').value());
});
ipcMain.on('cemu_name_check', (event, data) => {
	for (let cemu_instance of settings_storage.get('cemu_paths').value()) {
		if (cemu_instance.name.toUpperCase().trim() == data.toUpperCase().trim()) {
			dialog.showMessageBox(ApplicationWindow, {
				type: 'error',
				title: 'CemUI Error',
				message: 'Name Taken',
				detail: 'A Cemu instance with that name already exists. Please pick a different name',
				icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
			});
			return;
		}
	}
	let cemu_path = dialog.showOpenDialog({
		title: 'Select a Cemu executable',
		message: 'Select a Cemu executable',
		properties: ['openFile'],
		filters: [
			{name: 'All Executables', extensions: ['exe']}
		]
	});

	if (!cemu_path) {
		return;
	}
	cemu_path = cemu_path[0];

	let cemu_object = {};
	cemu_object.name = data;

	cemu_path = cemu_path.replace(/\\/g, '/');
	cemu_object.cemu_path = cemu_path;

	cemu_path = cemu_path.split('/');
	cemu_path.pop();
	cemu_object.cemu_folder_path = cemu_path.join('/');

	settings_storage.get('cemu_paths').push(cemu_object).write();
	ApplicationWindow.webContents.send('emulator_list', settings_storage.get('cemu_paths').value());
	ApplicationWindow.webContents.send('cemu_folder_added');
	updateContextMenuCemuInstances();
});
ipcMain.on('remove_cemu_instance', (event, data) => {
	settings_storage.get('cemu_paths').remove({name: data}).write();
	ApplicationWindow.webContents.send('emulator_list', settings_storage.get('cemu_paths').value());
	ApplicationWindow.webContents.send('cemu_folder_removed');
	updateContextMenuCemuInstances();
});

ipcMain.on('ask_for_games_folder_list', () => {
	ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
});
ipcMain.on('games_folder_path_check', () => {
	let games_folder_path = dialog.showOpenDialog({
		title: 'Select a games folder',
		message: 'Select a games folder',
		properties: ['openDirectory']
	});

	if (!games_folder_path) {
		return;
	}
	games_folder_path = games_folder_path[0];

	for (let game_folder of settings_storage.get('game_paths').value()) {
		if (game_folder == games_folder_path) {
			dialog.showMessageBox(ApplicationWindow, {
				type: 'error',
				title: 'CemUI Error',
				message: 'Path Taken',
				detail: 'A game folder already exists in that path',
				icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
			});
			return;
		}
	}


	settings_storage.get('game_paths').push(games_folder_path).write();
	ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
	ApplicationWindow.webContents.send('games_folder_added');
});
ipcMain.on('remove_games_folder', (event, data) => {
	let paths = settings_storage.get('game_paths').value(),
		new_paths = paths.splice(paths.indexOf(data), 1);

	settings_storage.get('game_paths', new_paths).write();
	ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
	ApplicationWindow.webContents.send('games_folder_removed');
});


ipcMain.on('play_rom', (event, data) => {
	var game = game_storage.get('games').find({title_id: data.rom}).value(),
		instance = settings_storage.get('cemu_paths').find({name: data.emu}).value(),
		game_path;

	if (!instance || !game) {
		return;
	}
	if (game.is_wud) {
		game_path = game.path;
	} else {
		game_path = game.path + '/code/' + game.rom;
	}

	game_storage.get('games').find(game).set('last_started', Date.now()).write();
	exec('"' + instance.cemu_path + '" -g ' + '"' + game_path + '"', {
		cwd: instance.cemu_folder_path
	}, (error, stdout, stderr) => {
		if (error) {
			logger.log({
				level: 'error',
				message: error
			});
			return;
		}

		game_storage.get('games').find(game).set('plays', game.plays+=1).write();
		game_storage.get('games').find(game).set('last_stopped', Date.now()).write();
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
		ApplicationWindow.webContents.send('smm_courses_list', courses)
	});
});

ipcMain.on('smm_save_api_key', (event, data) => {
	settings_storage.set('smmdb_api_key', data).write();
});

ipcMain.on('smm_upload_course', async (event, data) => {
	smm.apiKey(settings_storage.get('smmdb_api_key').value());

	logger.log({
		level: 'info',
		message: 'Uploading SMM level from ' + data
	});

	let course = smm_editor.loadCourseSync(data);
	await course.setMaker('');
	course.writeToSave(data.split('\\').pop().replace(/course/, ''), data);

	let zip = archiver('zip'),
		buffer;
		
	zip.pipe(
		bl((error, chunk) => {
			buffer = chunk;
		})
	);
	zip.directory(data, 'course000');
	await zip.finalize();
	
	smm.uploadCourse(buffer, (error, course_data) => {
		if (error) {
			logger.log({
				level: 'error',
				message: error
			});
			dialog.showMessageBox(ApplicationWindow, {
				type: 'error',
				title: 'CemUI Error',
				message: 'SMMDB Error',
				detail: error,
				icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
			});
			return;
		}
		/*
		dialog.showMessageBox(ApplicationWindow, {
			type: 'info',
			title: 'CemUI SMMDB',
			message: 'Course uploaded to SMMDB',
			detail: 'Course uploaded successfully. Course ID: ' + course_data[0].id
		});
		*/
		logger.log({
			level: 'info',
			message: 'upload course to SMMDB: ' + JSON.stringify(course_data)
		});
		ApplicationWindow.webContents.send('smm_course_uploaded', course_data[0]);		
	});
});

ipcMain.on('games_search_cache', (event, data) => {
	ApplicationWindow.webContents.send('ticket_cache_search_results', fuse_searchable.search(data).slice(0, 50));
});

ipcMain.on('update_game_settings', (event, data) => {
	var id = data.rom.toLowerCase().replace('-', ''),
		settings = data.settings,
		valid_games = game_storage.get('games').filter({title_id: data.rom}).value(),
		instance = settings_storage.get('cemu_paths').find({name: data.emu}).value();

	if (!valid_games || !instance) {
		return;
	}
	
	for (var i=0;i<valid_games.length;i++) {
		var game = valid_games[i];
		game_storage.get('games').find({path: game.path}).set('settings', settings).write();
	}
	
	fs.writeFileSync(instance.cemu_folder_path + '/gameProfiles/' + id + '.ini', ini.encode(settings));
});

ipcMain.on('smm_dl_level', function(event, data) {
	var SMMLevelFolder = pickSMMLevelFolder();
	if (!SMMLevelFolder) {
		return;
	}
	SMMLevelFolder = SMMLevelFolder[0];
	event.sender.send("smm_show_loader");

	logger.log({
		level: 'info',
		message: 'starting download of SMMDB course: ' + data
	});

	async.waterfall([
		function(callback) {
			event.sender.send("smm_level_dl_start");
			logger.log({
				level: 'info',
				message: 'starting backup zip of local course'
			});
			zipFolder(SMMLevelFolder, path.join(SMMLevelFolder, 'backup.zip'), function(err) {
			    if(err) {
			        logger.log({
						level: 'error',
						message: err
					});
			        callback(null);
			    } else {
			        callback(null);
				}
				logger.log({
					level: 'info',
					message: 'local course backed up'
				});
			});
		},
		function(callback) {

			var received_bytes = 0,
				total_bytes = 0;

			var req = request({
		        method: 'GET',
		        uri: 'https://smmdb.ddns.net/api/downloadcourse?type=zip&id=' + data
		    });

		    var out = fs.createWriteStream(path.join(SMMLevelFolder, 'new_level.zip'));
		    req.pipe(out);

		    req.on('response', function(data) {
		        total_bytes = parseInt(data.headers['content-length']);
		    });

		    req.on('data', function(chunk) {
		        received_bytes += chunk.length;
				var percent = (received_bytes * 100) / total_bytes;
				logger.log({
					level: 'info',
					message: 'downloaded ' + percent + '% of SMMDB course: ' + data
				});
		        event.sender.send("smm_level_progress", {progress: percent});
		    });

		    req.on('end', function() {
		    	callback(null);
		    });
		},
		function(callback) {
			event.sender.send("smm_level_extract");
			logger.log({
				level: 'info',
				message: 'unpacking SMMDB course: ' + data
			});
			fs.createReadStream(path.join(SMMLevelFolder, 'new_level.zip'))
			.pipe(unzip.Extract({ path: SMMLevelFolder }))
			.on('entry', (entry) => {
				logger.log({
					level: 'info',
					message: 'Found zip file ' + entry.path
				})
			})
			.on('close', () => {
				logger.log({
					level: 'info',
					message: 'unpacked SMMDB course: ' + data
				});
				callback(null);
			});
		},
		function(callback) {
			logger.log({
				level: 'info',
				message: 'removing zip of SMMDB course: ' + data
			});
			fs.unlink(path.join(SMMLevelFolder, 'new_level.zip'), function() {
				logger.log({
					level: 'info',
					message: 'removed zip of SMMDB course: ' + data
				});
				callback(null);
	    	});
		},
		function(callback) {
			var dir = getDirectories(SMMLevelFolder)[0];
			fs.readdir(path.join(SMMLevelFolder, dir), (err, files) => {
				for (var i = 0; i < files.length; i++) {
					var file_data = fs.readFileSync(path.join(SMMLevelFolder, dir, files[i]));
					fs.writeFileSync(path.join(SMMLevelFolder, files[i]), file_data);
				}
			});
			callback(null, dir);
		},
		function(dir, callback) {
			fs.remove(path.join(SMMLevelFolder, dir), error => {
			  	if (error) {
			  		logger.log({
						level: 'error',
						message: error
					});
			  		callback(null);
			  	}
			  	callback(null);
			});
		}
	], function() {
		event.sender.send("smm_hide_loader");
		event.sender.send("smm_level_dl_end");
	});
});

ipcMain.on('dl_game', (event, data) => {
	async.waterfall([
		function(callback) {
			var gameFolder = dialog.showOpenDialog({
				title: 'Select where you want to download this title',
				message: 'Select where you want to download this title',
				properties: ['openDirectory']
			});
		
			if (!gameFolder) {
				return callback(true);
			}
			gameFolder = gameFolder[0];
			callback(null, gameFolder);
		},
		function(gameFolder, callback) {
			request('http://cemui.com/api/v2/image/icon/' + data.tid.toUpperCase(), {encoding: null}, (error, response, body) => {
				callback(null, gameFolder, body);
			})
		},
		function(gameFolder, image_buffer, callback) {
			let rom_dl_path = path.join(gameFolder, data.title + ' [' + data.region + '] [' + data.tid + ']');
			data.location = rom_dl_path;
			ApplicationWindow.webContents.send('game_dl_started', data);
			NUSRipper.downloadTID(data.tid, rom_dl_path, null, () => {
				if (NUSRipper.CANCEL_LIST.contains(NUSRipper.formatTID(data.tid))) {
					logger.log({
						level: 'info',
						message: 'Download for ' + NUSRipper.formatTID(data.tid) + ' aborted'
					});
					return callback(true);
				}
				
				logger.log({
					level: 'info',
					message: 'Verifying encrypted download for ' + NUSRipper.formatTID(data.tid) + ' at ' + rom_dl_path + '...'
				});
				NUSRipper.verifyEncryptedContents(rom_dl_path, data.tid, () => {
					logger.log({
						level: 'info',
						message: 'Decrypting files for ' + NUSRipper.formatTID(data.tid) + ' at ' + rom_dl_path + '...'
					});
					NUSRipper.decrypt(rom_dl_path, (cdecrypt_missing) => {
						logger.log({
							level: 'info',
							message: 'Game ' + NUSRipper.formatTID(data.tid) + ' downloaded at ' + rom_dl_path + '...'
						});
						callback(null, gameFolder, image_buffer);
						if (cdecrypt_missing) {
							var notification = new notifications({
								title: 'Finished downloading ' + data.title + ' (' + data.region + ')',
								body: 'Game downloaded successfully (IS NOT DECRYPTED)',
								icon: electron.nativeImage.createFromBuffer(image_buffer)
							});
							notification.show();
							
							notification.on('click', (event) => {
								shell.openItem(rom_dl_path);
							});
						} else if (fs.pathExistsSync(path.join(rom_dl_path, 'meta', 'iconTex.tga'))) {
							tga2png(path.join(rom_dl_path, 'meta', 'iconTex.tga')).then(buffer => {
								var notification = new notifications({
									title: 'Finished downloading ' + data.title + ' (' + data.region + ')',
									body: 'Game downloaded and decrypted successfully',
									icon: electron.nativeImage.createFromBuffer(image_buffer)
								});
								notification.show();
								
								notification.on('click', (event) => {
									shell.openItem(rom_dl_path);
								});
							});
						} else {
							var notification = new notifications({
								title: 'ERROR',
								body: data.title + ' (' + data.region + ') DID NOT DOWNLOAD/EXTRACT CORRECTLY\nPLEASE TRY AGAIN',
								icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
							});
							notification.show();
							
							notification.on('click', (event) => {
								shell.openItem(rom_dl_path);
							});
						}
					});
				});
			});
		},
		function(gameFolder, image_buffer, callback) {
			if (data.dl_update) {
				let new_data = data;
				new_data.tid = data.tid = data.tid.replace('00050000', '0005000e')
				let rom_dl_path = path.join(gameFolder, new_data.title + ' [Update v' + new_data.dl_update + '] [' + new_data.region + '] [' + new_data.tid + ']');
				new_data.location = rom_dl_path;
				new_data.title = data.title.concat(' Update v' + new_data.dl_update);
				
				ApplicationWindow.webContents.send('game_dl_started', new_data);
				NUSRipper.downloadTID(new_data.tid, rom_dl_path, new_data.dl_update, () => {
					if (NUSRipper.CANCEL_LIST.contains(NUSRipper.formatTID(new_data.tid))) {
						logger.log({
							level: 'info',
							message: 'Download for ' + NUSRipper.formatTID(new_data.tid) + ' aborted'
						});
						return callback(true);
					}
					
					logger.log({
						level: 'info',
						message: 'Verifying encrypted download for ' + NUSRipper.formatTID(new_data.tid) + ' at ' + rom_dl_path + '...'
					});
					NUSRipper.verifyEncryptedContents(rom_dl_path, new_data.tid, () => {
						logger.log({
							level: 'info',
							message: 'Decrypting files for ' + NUSRipper.formatTID(new_data.tid) + ' at ' + rom_dl_path + '...'
						});
						NUSRipper.decrypt(rom_dl_path, (cdecrypt_missing) => {
							logger.log({
								level: 'info',
								message: 'Update for ' + NUSRipper.formatTID(new_data.tid) + ' downloaded at ' + rom_dl_path + '...'
							});
							callback(null, gameFolder, image_buffer);
							if (cdecrypt_missing) {
								var notification = new notifications({
									title: 'Finished downloading ' + new_data.title + ' (' + new_data.dl_update + ') (' + new_data.region + ')',
									body: 'Update downloaded successfully (IS NOT DECRYPTED)',
									icon: electron.nativeImage.createFromBuffer(image_buffer)
								});
								notification.show();
								
								notification.on('click', (event) => {
									shell.openItem(rom_dl_path);
								});
							} else if (fs.pathExistsSync(path.join(rom_dl_path, 'meta', 'iconTex.tga'))) {
								tga2png(path.join(rom_dl_path, 'meta', 'iconTex.tga')).then(buffer => {
									var notification = new notifications({
										title: 'Finished downloading ' + new_data.title + ' (' + new_data.dl_update + ') (' + data.region + ')',
										body: 'Update downloaded and decrypted successfully',
										icon: electron.nativeImage.createFromBuffer(image_buffer)
									});
									notification.show();
									
									notification.on('click', (event) => {
										shell.openItem(rom_dl_path);
									});
								});
							} else {
								var notification = new notifications({
									title: 'ERROR',
									body: data.title + ' (' + data.dl_update + ') (' + data.region + ') DID NOT DOWNLOAD/EXTRACT CORRECTLY\nPLEASE TRY AGAIN',
									icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
								});
								notification.show();
								
								notification.on('click', (event) => {
									shell.openItem(rom_dl_path);
								});
							}
						});
					});
				});
			} else {
				callback(null, gameFolder, image_buffer);
			}
		},
		function(gameFolder, image_buffer, callback) {
			if (data.dl_dlc) {
				let new_data = data;
				new_data.tid = data.tid = data.tid.replace('00050000', '0005000c').replace('0005000e', '0005000c')
				let rom_dl_path = path.join(gameFolder, new_data.title + ' [DLC] [' + new_data.region + '] [' + new_data.tid + ']');
				new_data.location = rom_dl_path;
				new_data.title = data.title.concat(' DLC');
				
				ApplicationWindow.webContents.send('game_dl_started', new_data);
				NUSRipper.downloadTID(new_data.tid, rom_dl_path, null, () => {
					if (NUSRipper.CANCEL_LIST.contains(NUSRipper.formatTID(new_data.tid))) {
						logger.log({
							level: 'info',
							message: 'Download for ' + NUSRipper.formatTID(new_data.tid) + ' aborted'
						});
						return callback(true);
					}
					
					logger.log({
						level: 'info',
						message: 'Verifying encrypted download for ' + NUSRipper.formatTID(new_data.tid) + ' at ' + rom_dl_path + '...'
					});
					NUSRipper.verifyEncryptedContents(rom_dl_path, new_data.tid, () => {
						logger.log({
							level: 'info',
							message: 'Decrypting files for ' + NUSRipper.formatTID(new_data.tid) + ' at ' + rom_dl_path + '...'
						});
						NUSRipper.decrypt(rom_dl_path, (cdecrypt_missing) => {
							logger.log({
								level: 'info',
								message: 'DLC for ' + NUSRipper.formatTID(new_data.tid) + ' downloaded at ' + rom_dl_path + '...'
							});
							callback(null, gameFolder, image_buffer);
							if (cdecrypt_missing) {
								var notification = new notifications({
									title: 'Finished downloading ' + new_data.title + ' (DLC) (' + new_data.region + ')',
									body: 'Update downloaded successfully (IS NOT DECRYPTED)',
									icon: electron.nativeImage.createFromBuffer(image_buffer)
								});
								notification.show();
								
								notification.on('click', (event) => {
									shell.openItem(rom_dl_path);
								});
							} else if (fs.pathExistsSync(path.join(rom_dl_path, 'meta', 'iconTex.tga'))) {
								tga2png(path.join(rom_dl_path, 'meta', 'iconTex.tga')).then(buffer => {
									var notification = new notifications({
										title: 'Finished downloading ' + new_data.title + ' (DLC) (' + new_data.region + ')',
										body: 'Update downloaded and decrypted successfully',
										icon: electron.nativeImage.createFromBuffer(image_buffer)
									});
									notification.show();
									
									notification.on('click', (event) => {
										shell.openItem(rom_dl_path);
									});
								});
							} else {
								var notification = new notifications({
									title: 'ERROR',
									body: new_data.title + ' (' + new_data.dl_update + ') (' + new_data.region + ') DID NOT DOWNLOAD/EXTRACT CORRECTLY\nPLEASE TRY AGAIN',
									icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
								});
								notification.show();
								
								notification.on('click', (event) => {
									shell.openItem(rom_dl_path);
								});
							}
						});
					});
				});
			} else {
				callback(null, gameFolder, image_buffer);
			}
		}
	], (cancel) => {
		if (cancel) return;
	});
});

ipcMain.on('cancel_game', (event, data) => {
	NUSRipper.cancel(data);
});

ipcMain.on('smm_load_client_courses', async () => {
	ApplicationWindow.webContents.send('smm_show_loader');
	sendSMMCourses();	
});

ipcMain.on('smm_upload_level', (event, data) => {
	ApplicationWindow.webContents.send('smm_show_loader');

});

ipcMain.on('smm_change_thumbnail_image', async (event, data) => {
	ApplicationWindow.webContents.send('smm_show_loader');
	let image_location = dialog.showOpenDialog({
		title: 'Select new thumbnail',
		message: 'Select new thumbnail',
		properties: ['openFile'],
		filters: [
			{name: 'thumbnail1.jpg', extensions: ['jpg', 'jpeg']}
		]
	});

	if (!image_location) {
		ApplicationWindow.webContents.send('smm_hide_loader');
		return;
	}
	image_location = image_location[0];

	let course = smm_editor.loadCourseSync(data);
	await course.exportThumbnail();
	
	fs.copySync(image_location, path.join(data, 'thumbnail1.jpg'));
	await course.setThumbnail(
		path.join(data, 'thumbnail0.jpg'),
		path.join(data, 'thumbnail1.jpg')
	);

	await course.writeThumbnail();
	
	sendSMMCourses();
});

ipcMain.on('smm_change_preview_image', async (event, data) => {
	ApplicationWindow.webContents.send('smm_show_loader');
	let image_location = dialog.showOpenDialog({
		title: 'Select new preview',
		message: 'Select new preview',
		properties: ['openFile'],
		filters: [
			{name: 'thumbnail0.jpg', extensions: ['jpg', 'jpeg']}
		]
	});

	if (!image_location) {
		ApplicationWindow.webContents.send('smm_hide_loader');
		return;
	}
	image_location = image_location[0];
	
	let course = smm_editor.loadCourseSync(data);
	await course.exportThumbnail();
	
	fs.copySync(image_location, path.join(data, 'thumbnail0.jpg'));
	await course.setThumbnail(
		path.join(data, 'thumbnail0.jpg'),
		path.join(data, 'thumbnail1.jpg')
	);

	await course.writeThumbnail();
	
	sendSMMCourses();
});

function sendScreens() {

	var screenGames = false,
		screenCemu = false,
		screenWelcome = false; //screen welcome is always false, can you fix that red. it needs to show when you first launch (when json file is created for example.)

	if (!settings_storage.get('cemu_paths').value() || settings_storage.get('cemu_paths').value().length < 1) {
		settings_storage.set('cemu_paths', []).write();
		screenCemu = true;
	}

	if (!settings_storage.get('game_paths').value() || settings_storage.get('game_paths').value().length < 1) {
		settings_storage.set('game_paths', []).write();
		screenGames = true;
	}
    
    if (screenCemu || screenGames || screenWelcome) {
        ApplicationWindow.webContents.send('show_screen', {games: screenGames, cemu: screenCemu, welcome: screenWelcome});
        return;
    } else {
        ApplicationWindow.webContents.send('show_screen', null);
        return;
    }
}

function init() {
	verifyGames(() => {
		let load_games_queue = async.queue((game_path, callback) => {
			loadGames(game_path, () => {
				callback();
			});
		});
	
		load_games_queue.drain = () => {
			var games = game_storage.get('games').value();
			ApplicationWindow.webContents.send('games_folder_list', settings_storage.get('game_paths').value());
			if (!games || games.length <= 0) {
				ApplicationWindow.webContents.send('emulator_list', settings_storage.get('cemu_paths').value());
				ApplicationWindow.webContents.send('init_complete', {library: [], most_played: [], suggested: []});
			} else {
				let most_played = getMostPlayed(games);
				getSuggested(most_played, (error, suggested) => {
					if (error) throw error;
					ApplicationWindow.webContents.send('emulator_list', settings_storage.get('cemu_paths').value());
					ApplicationWindow.webContents.send('init_complete', {library: fs.readJSONSync(path.join(DATA_ROOT, 'cache/json/games.json')).games, most_played: most_played, suggested: suggested});
				});
			}
			updateContextMenuCemuInstances();
		}
	
		load_games_queue.push(settings_storage.get('game_paths').value());
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
		if (error || response.statusCode !== 200 || !body || body.error) return cb(true);
		try {
			body = JSON.parse(body);
			return cb(null, body);
		} catch (error) {
			return cb(true);
		}
	});
}

function verifyGames(cb) {
	var games = game_storage.get('games').value(),
		paths = settings_storage.get('game_paths').value();
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

		if (!paths.contains(game.path_root)) {
			game_storage.get('games').remove(game).write();
		}
	}

	return cb();
}

function loadGames(dir, master_callback) {
	fs.readdir(dir, (error, files) => {
		if (error) throw error;

		async.each(files, (file, callback) => {
			let exists = game_storage.get('games').find({ path: dir + '/' + file }).value();
			if (exists) {
				return callback();
			}
			if (isGame(dir + '/' + file)) {
				async.waterfall([
					function(cb) {
						let is_wud = false
						logger.log({
							level: 'info',
							message: 'Found new game ' + file
						});
			
						if (path.extname(dir + '/' + file) == '.wud' || path.extname(dir + '/' + file) == '.wux') {
							is_wud = true;
						}
						cb(null, is_wud);
					},
					function(is_wud, cb) {
						request(API_ROOT, (error, response, body) => {
							if (error) {
								logger.log({
									level: 'error',
									message: 'DNS ERROR WHILE SCANNING DATA FOR ' + file
								});
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
							logger.log({
								level: 'error',
								message: error
							});
							return cb(true);
						}
						
						
						if (!is_wud) {
							if (!xml || !xml.title_id) {
								logger.log({
									level: 'error',
									message: 'Failed to find TID for ' + file
								});
								return cb(true);
							}
						}

						cb(null, is_wud);
					},
					function(is_wud, cb) {
						var name = file;
						getGameData(dir + '/' + file, is_wud, (error, data) => {
							if (error) {
								logger.log({
									level: 'error',
									message: error
								});
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
									logger.log({
										level: 'error',
										message: error
									});
									return sc_callback(url);
								});
								
								req.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + urls.indexOf(url) + '.jpg'))
								.on('error', (error) => {
									logger.log({
										level: 'error',
										message: error
									});
									return sc_callback(url);
								})
								.on('close', () => {
									logger.log({
										level: 'info',
										message: 'Downloaded screenshot ' + urls.indexOf(url) + ' for ' + data.game_title_id + ' to ' + DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + urls.indexOf(url) + '.jpg'
									});
									data.screenshots_list.push(DATA_ROOT + 'cache/images/' + data.game_title_id + '/screenshots/' + urls.indexOf(url) + '.jpg');
									sc_callback(null);
								});
							}, (error) => {
								if (error) {
									logger.log({
										level: 'error',
										message: error
									});
								  	return cb(true);
								} else {
									return cb(null, data, name, is_wud);
								}
							});
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
							fs.createReadStream(path.join(LOCAL_RESOURCES_ROOT, 'defaults/box.jpg'))
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
									logger.log({
										level: 'error',
										message: error
									});
									return cb(true);
								})
								.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg'))
								.on('error', (error) => {
									logger.log({
										level: 'error',
										message: error
									});
									return cb(true);
								})
								.on('close', () => {
									jimp.read(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg', (error, icon) => {
										if (error) {
											logger.log({
												level: 'error',
												message: error
											});
											return cb(true);
										}
										icon.write(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png', (error) => {
											if (error) {
												logger.log({
													level: 'error',
													message: error
												});
												return cb(true);
											}
											fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg');
	
											png2ico(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png').then((buffer) => {
												fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png');
												fs.writeFileSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico', buffer);
												cb(null, data, name, is_wud);
											}).catch((error) => {
												logger.log({
													level: 'error',
													message: error
												});
												return cb(true);
											});
										});
									})
								});
							} else {
								logger.log({
									level: 'info',
									message: 'No icon found for ' + data.game_title + '. Defaulting to default icon'
								});
								fs.createReadStream(path.join(LOCAL_RESOURCES_ROOT, 'defaults/icon.ico'))
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
								logger.log({
									level: 'error',
									message: error
								});
								return cb(true);
							})
							.pipe(fs.createWriteStream(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg'))
							.on('error', (error) => {
								logger.log({
									level: 'error',
									message: error
								});
								return cb(true);
							})
							.on('close', () => {
								jimp.read(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg', (error, icon) => {
									if (error) {
										logger.log({
											level: 'error',
											message: error
										});
										return cb(true);
									}
									icon.write(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png', (error) => {
										if (error) {
											logger.log({
												level: 'error',
												message: error
											});
											return cb(true);
										}
										fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.jpg');

										png2ico(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png').then((buffer) => {
											fs.removeSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.png');
											fs.writeFileSync(DATA_ROOT + 'cache/images/' + data.game_title_id + '/icon.ico', buffer);
											cb(null, data, name, is_wud);
										}).catch((error) => {
											logger.log({
												level: 'error',
												message: error
											});
											return cb(true);
										});
									});
								})
							});
						} else {
							logger.log({
								level: 'info',
								message: 'No icon found for ' + data.game_title + '. Defaulting to default icon'
							});
							fs.createReadStream(path.join(LOCAL_RESOURCES_ROOT, 'defaults/icon.ico'))
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
							fs.createReadStream(path.join(LOCAL_RESOURCES_ROOT, 'defaults/grid.jpg'))
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
						last_started: Date.now(),
						last_stopped: Date.now(),
						is_wud: is_wud,
						title_id: data.game_title_id,
						product_code: data.game_product_code,
						path_root: dir,
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
					logger.log(event)
				}
				if (event.removedFiles || event.removedFolders) {
					checkInvalidGames();
				}
			});*/
		});
	});
}

function pickSMMLevelFolder() {
	let instance = settings_storage.get('cemu_paths').find({name: 'Default'}).value();
	if (!instance) return;

	let smm_base_folder = path.join(instance.cemu_folder_path, 'mlc01', 'emulatorSave'),
		smm_save_dir = smm_base_folder;
	
	for (let smm_save_path of SMM_VALID_SAVE_PATHS) {
		if (fs.pathExistsSync(path.join(smm_base_folder, smm_save_path))) {
			smm_save_dir = path.join(smm_base_folder, smm_save_path);
			break;
		}
	}
	var SMMLevelFolder = dialog.showOpenDialog({
		title: 'Select a Super Mario Maker level to overwrite.',
		defaultPath: smm_save_dir,
		properties: ['openDirectory']
	});

	if (!SMMLevelFolder) {
		return;
	}
	return SMMLevelFolder;
}
function pickGameFolder() {
	var gameFolder = dialog.showOpenDialog({
		title: 'Select your games folder',
		message: 'Select your games folder',
		properties: ['openDirectory']
	});

	if (!gameFolder) {
		return false;
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
		return false;
	}
	return emuFolder[0];
}

function isGame(game_path) {
	if (path.extname(game_path) == '.wud' || path.extname(game_path) == '.wux') return true;

	var stats = fs.lstatSync(game_path);
	if (!stats) return false;

	if (stats.isSymbolicLink() || stats.isDirectory()) {
		let subfolders;
		if (stats.isSymbolicLink()) {
			subfolders = fs.readdirSync(fs.readlinkSync(game_path));
		} else {
			subfolders = fs.readdirSync(game_path);
		}
		
		if (subfolders.contains('code') && subfolders.contains('content')) {
			if (!fs.pathExistsSync(game_path + '/code/app.xml')) {
				return false;
			}
			if (subfolders.contains('meta') && fs.pathExistsSync(game_path + '/meta/meta.xml')) {
				let xml = XMLParser.parse(game_path + '/meta/meta.xml');
				if (xml.title_id._Data.substring(4, 8) != '0000') return false;
				xml = XMLParser.parse(game_path + '/code/app.xml');
				if (xml.title_id._Data.substring(4, 8) != '0000') return false;

				var rom = fs.readdirSync(game_path + '/code').filter(/./.test, /\.rpx$/i);
				if (!rom || rom.length < 0) return false;
			} else if (fs.pathExistsSync(game_path + '/code/app.xml')) {
				let xml = XMLParser.parse(game_path + '/code/app.xml');
				if (xml.title_id._Data.substring(4, 8) != '0000') return false;

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
		cemu = settings_storage.get('cemu_paths').find({name: emulator}).value(),
		rom;
	if (!game || !cemu) return;

	if (game.is_wud) {
		rom = game.path;
	} else {
		rom = game.path + '/code/' + game.rom;
	}

	ws.create(require('os').homedir() + '/Desktop/' + game.name_clean + ' (' + emulator + ').lnk', {
		target : cemu.cemu_path,
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

function getDirectories(src) {  // Gets dirs
	return fs.readdirSync(src).filter(file => fs.statSync(path.join(src, file)).isDirectory());
}

async function sendSMMCourses() {
	let smm_courses = [];
		
	for (let cemu_path of settings_storage.get('cemu_paths').value()) {
		for (let smm_save_path of SMM_VALID_SAVE_PATHS) {
			if (fs.pathExistsSync(path.join(cemu_path.cemu_folder_path, 'mlc01/emulatorSave', smm_save_path))) {
				let save = await smm_editor.loadSave(path.join(cemu_path.cemu_folder_path, 'mlc01/emulatorSave', smm_save_path));

				let saved_courses = await save.loadCourses(),
					courses = {
					save_dir: smm_save_path,
					cemu_path: cemu_path.cemu_folder_path,
					courses: []
				}

				await save.importThumbnail();
				await save.exportThumbnail();

				
				for (let course in saved_courses) {
					var course_id = course.replace(/course/, '');
					course = saved_courses[course];

					courses.courses.push({
						id: course_id,
						course_id: 'course' + course_id,
						save_id: smm_save_path,
						thumbnail: course.thumbnailPreview,
						preview: course.thumbnail,
						cemu: cemu_path.cemu_folder_path,
						title: course.title,
						maker: course.maker
					});

					console.log(course.maker);
				}
				smm_courses.push(courses);
			}
		}
	}

	ApplicationWindow.webContents.send('smm_hide_loader');
	ApplicationWindow.webContents.send('smm_player_courses', smm_courses);
}

function getThemes() {
	let themes = [{
		name: 'Flux',
		is_built_in: true,
		config: fs.readJsonSync(path.join(__dirname, 'app', 'Flux', 'config.json')),
		screenshot: path.join(__dirname, 'app', 'Flux', 'thumbnail.jpg')
	},
	{
		name: 'Fluent',
		is_built_in: true,
		config: fs.readJsonSync(path.join(__dirname, 'app', 'Fluent', 'config.json')),
		screenshot: path.join(__dirname, 'app', 'Fluent', 'thumbnail.jpg')
	}];

	let custom_themes = getDirectories(path.join(DATA_ROOT, 'themes'));
	for (let custom_theme of custom_themes) {
		if (!fs.pathExistsSync(path.join(DATA_ROOT, 'themes', custom_theme, 'config.json'))) {
			return;
		}
		let theme_config = fs.readJsonSync(path.join(DATA_ROOT, 'themes', custom_theme, 'config.json')),
			theme = {
				name: custom_theme,
				config: theme_config,
				screenshot: path.join(DATA_ROOT, 'themes', custom_theme, 'thumbnail.jpg')
			}

		themes.push(theme);
	}
	return themes;
}

function sendThemes(themes) {
	ApplicationWindow.webContents.send('themes_list', themes);
}

function updateContextMenuCemuInstances() {
	context[0].submenu = [];
	for (let instance of settings_storage.get('cemu_paths').value()) {
		context[0].submenu.push({
			label: instance.name,
			submenu: [
				{
					label: 'Install game update or DLC',
					async click () {
						var meta_location = dialog.showOpenDialog({
							title: 'Select update/DLC meta.xml',
							message: 'Select update/DLC meta.xml',
							properties: ['openFile'],
							filters: [
								{name: 'meta.xml', extensions: ['xml']}
							]
						});
						if (!meta_location) return;
						meta_location = meta_location[0];

						let xml = XMLParser.parse(meta_location),
							title_id = xml.title_id._Data,
							titld_id_type = title_id.substring(4, 8),
							title_version = xml.title_version._Data,
							copy_path, finish_message;

						if (titld_id_type.toUpperCase() == '000C') {
							copy_path = path.join(instance.cemu_folder_path, 'mlc01', 'usr', 'title', '00050000', title_id.substring(8), 'aoc');
						} else if (parseInt(title_version) > 0) {
							copy_path = path.join(instance.cemu_folder_path, 'mlc01', 'usr', 'title', '00050000', title_id.substring(8));							
						} else {
							return;
						}

						fs.ensureDirSync(copy_path);
						await fs.copy(path.join(meta_location, '../../', 'code'), path.join(copy_path, 'code'));
						await fs.copy(path.join(meta_location, '../../', 'content'), path.join(copy_path, 'content'));
						await fs.copy(path.join(meta_location, '../../', 'meta'), path.join(copy_path, 'meta'));
					
						if (titld_id_type.toUpperCase() == '000C') {
							finish_message = 'DLC for ' + xml.longname_en._Data + ' installed to\n' + instance.cemu_folder_path;
						} else if (parseInt(title_version) > 0) {
							finish_message = 'Update v' + xml.title_version._Data + ' for ' + xml.longname_en._Data + ' installed to\n' + instance.cemu_folder_path;
						}

						dialog.showMessageBox(ApplicationWindow, {
							type: 'info',
							title: 'CemUI',
							message: 'Update/DLC added',
							detail: finish_message
						});
					}
				}
			]
		});
	}
	context_menu = Menu.buildFromTemplate(context);
	Menu.setApplicationMenu(context_menu);
}

function clearCache() {
	fs.unlinkSync(DATA_ROOT + 'cache/json/games.json');
	fs.unlinkSync(DATA_ROOT + 'cache/json/settings.json');
}

function setupDefaults() {

	setupDefaultFiles();

	let settings_defaults = {
			cemu_paths: [],
			game_paths: [],
			theme: 'Flux',
			smmdb_api_key: '',
			ticket_cache_folder: path.join(DATA_ROOT, 'ticketcache'),
			ticket_cache_vendor: 'http://cemui.com/api/v2/ticketcache',
			ticket_vendor: 'http://wiiu.titlekeys.gq/',
			cdecrypt_location: '',
		},
		games_defaults = {
			games: []
		}

	if (update_cache_version) {
		settings_defaults.cache_version = CACHE_VERSION;
	}

	game_storage = low(new FileSync(DATA_ROOT + 'cache/json/games.json'));
	game_storage.defaults(games_defaults).write();
	settings_storage = low(new FileSync(DATA_ROOT + 'cache/json/settings.json'));
	settings_storage.defaults(settings_defaults).write();
}

function setupDefaultFiles() {
	fs.ensureDirSync(DATA_ROOT + 'cache/images');
	fs.ensureDirSync(DATA_ROOT + 'cache/json');
	fs.ensureDirSync(DATA_ROOT + 'themes');
	if (!fs.existsSync(DATA_ROOT + 'cache/json/games.json')) {
		fs.writeFileSync(DATA_ROOT + 'cache/json/games.json', JSON.stringify({}));
	}
	if (!fs.existsSync(DATA_ROOT + 'cache/json/settings.json')) {
		fs.writeFileSync(DATA_ROOT + 'cache/json/settings.json', JSON.stringify({}));
	}
}

function verifyCacheVersion(cb) {
	let c_version = fs.readJsonSync(DATA_ROOT + 'cache/json/settings.json').cache_version;
	if (!c_version || c_version != CACHE_VERSION) {
		dialog.showMessageBox(ApplicationWindow, {
			type: 'question',
			buttons: ['Yes delete old cache and restart', 'No, continue'],
			title: 'CemUI Error',
			message: 'Out of date cache version',
			detail: 'CemUI has detected an out of date/invalid cache version. You may experience issues with this cache version.\nWould you like CemUI to delete and remake the cache?',
			icon: path.join(LOCAL_RESOURCES_ROOT, 'defaults/error.png')
		}, (response) => {
			return cb(response);
            if (response === 0) {
                app.relaunch();
                app.quit();
            }
        });
	} else {
		return cb();
	}
}

Array.prototype.contains = function(el) {
    return this.indexOf(el) > -1;
}