var electron = require('electron'),
    fs = require('fs'),
    originalFs = require('original-fs'),
    path = require('path'),
    url = require('url'),
    dialog = electron.dialog,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain,
    app = electron.app;


let ApplicationWindow; // Main application window

function createWindow(file) { // Creates window from file
  	ApplicationWindow = new BrowserWindow({
  		icon: './ico.png'
  	});
  	ApplicationWindow.loadURL(url.format({ // Makes the window
  		pathname: path.join(__dirname, '/app/'+file+'.html'),
    	protocol: 'file:',
    	slashes: true
  	}));
	
	ApplicationWindow.on('closed', () => {
    	ApplicationWindow = null;
	});
	ApplicationWindow.maximize();
	ApplicationWindow.setMenu(null);
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