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
    let current_view = document.getElementById('webview'),
        new_view = document.createElement('iframe');
                   
    addEvent(new_view, 'load', () => {
        new_view.style.display = '';
        document.body.removeChild(document.getElementById('webview'));
        new_view.setAttribute('id','webview');
    });
    new_view.style.display = 'none';
    new_view.setAttribute('src', data.path);
    document.body.appendChild(new_view);
    new_view.contentWindow.ipcRenderer = ipcRenderer;
}
ipcRenderer.on('theme_change',setTheme);
ipcRenderer.send('ask_for_theme');