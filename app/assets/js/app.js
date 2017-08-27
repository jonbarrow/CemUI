var {ipcRenderer, remote} = require('electron'),
    path = require('path'),
    url = require('url'),
    BrowserWindow = remote.BrowserWindow;


window.addEventListener('load', function() {
    ipcRenderer.send('init');
});

(function() {

    

    /*var gamepad_window = new BrowserWindow({
        width: 775,
        height: 450,
        resizable: false,
        frame: false
    });

    gamepad_window.webContents.on('did-finish-load', ()=>{
        gamepad_window.show();
        gamepad_window.focus();
    });

    gamepad_window.loadURL(url.format({ // Makes the window
        pathname: path.join(__dirname, 'gamepad.html'),
        protocol: 'file:',
        slashes: true
    }));*/
})()