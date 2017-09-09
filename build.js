"use strict"

var builder = require("electron-builder"),
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
});