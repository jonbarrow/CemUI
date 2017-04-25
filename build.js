var packager = require('electron-packager')

packager({
	"dir": ".",
	"name": "CemuManager",
	"overwrite": true,
	"asar": true,
	"out": "builds/",
	"platform": "win32",
	"arch": "ia32",
	"icon": "./ico.ico"
}, function done_callback (err, appPaths) {
	if(err) {
		console.error(err);
		process.exit(1);
	}
	console.log(appPaths);
});
