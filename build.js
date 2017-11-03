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
        },
        extraResources: [
            "defaults",
            "uni.cert",
        ],
        files: [
            "!builds",
            "!.gitignore",
            "!README.md",
            "!CHANGELOG.md",
            "!FAQ.md",
            "!issue_template.md",
            "!logo.psd",
            "!logo.png",
            "!build.js",
            "!smm.js",
            "!test.js",
            "!cemui.info.log",
            "!cemui.error.log",
            "!cemui.log",
            "!log.txt",
        ],
    }
}).then(() => {
    console.log('Done');
}).catch((error) => {
    throw error;
});