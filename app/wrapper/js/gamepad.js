Controller.search({
    settings: {
        useAnalogAsDpad: "both"
    }
});

window.addEventListener('gc.controller.found', function(event) {
    ipcRenderer.send('controller_event', {
        name: 'found',
        event: event
    });
    
}, false);

window.addEventListener('gc.button.press', function(event) {
    ipcRenderer.send('controller_event', {
        name: 'button_press',
        event: event.detail
    });
}, false);