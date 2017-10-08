let ipcRenderer = window.ipcRenderer;

addEvent(window, 'load', function() {
    ipcRenderer.send('init', {
        page: '_dlgames'
    });
});