"use strict"

var packager = require('electron-packager'),
    builder = require("electron-builder"),
    targets = builder.Platform;

builder.build({
    targets: targets.WINDOWS.createTarget(),
    config: {
        "appId": "com.cemui.app",
        "productName": "CemUI",
        "asar": true,
        "icon": "icon.ico",
        "directories": {
          "output": "builds"
        }
    }
}).then(() => {
    console.log('Done');
}).catch((error) => {
    throw error;
})
/*
packager({
	"dir": ".",
	"name": "CemUI",
	"overwrite": true,
	"asar": true,
	"out": "builds/",
	"platform": "win32",
	"arch": "ia32",
    "icon": "./ico.ico",
    "ignore": [
        "node_modules",
        "cache",
        "builds"
    ],
	"win32metadata": {
		"CompanyName": "CemUI",
		"FileDescription": "A small launcher for the Cemu WiiU emulator made with Electron",
		"OriginalFilename": "CemUI",
		"ProductName": "Cemu Manager",
		"InternalName": "CemUI"
	}
}, function (err, appPaths) {
	if(err) {
		console.error(err);
		process.exit(1);
	}
	console.log(appPaths);
});
*/