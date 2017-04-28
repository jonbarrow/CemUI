var packager = require('electron-packager')

packager({
	"dir": ".",
	"name": "CemUI",
	"overwrite": true,
	"asar": true,
	"out": "builds/",
	"platform": "win32",
	"arch": "ia32",
	"icon": "./ico.ico",
	"win32metadata": {
		"CompanyName": "CemUI",
		"FileDescription": "A small launcher for the Cemu WiiU emulator made with Electron",
		"OriginalFilename": "CemUI",
		"ProductName": "Cemu Manager",
		"InternalName": "CemUI"
	}
}, function done_callback (err, appPaths) {
	if(err) {
		console.error(err);
		process.exit(1);
	}
	console.log(appPaths);
});
