const {ipcRenderer} = require('electron');
//ipcRenderer.send('open_dev');
function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

addEvent(document.getElementsByClassName('flux')[0], 'click', function() {
    ipcRenderer.send('change_theme', {
        name: 'Flux'
    });
});
addEvent(document.getElementsByClassName('fluent')[0], 'click', function() {
    ipcRenderer.send('change_theme', {
        name: 'Fluent'
    });
});
            
addEvent(window, 'keypress', function(event) {
    if (event.charCode == 112) {
        ipcRenderer.send('open_dev');
    }
});
function setTheme(event,data) {
    document.body.removeChild(document.getElementById('webview'));
    var webview = document.createElement('iframe');
    webview.setAttribute('id','webview');
    webview.setAttribute('src',data.path);
    document.body.appendChild(webview);
    webview.contentWindow.ipcRenderer = ipcRenderer;
}
ipcRenderer.on('theme_change',setTheme);
ipcRenderer.send('ask_for_theme');