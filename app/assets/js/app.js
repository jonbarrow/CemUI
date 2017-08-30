const {ipcRenderer} = require('electron'); // Gets ipcRenderer
var games_lib = document.getElementById('games-lib');

ipcRenderer.on('init_complete', function(event, data) {
    for (var i=0;i<data.length;i++) {
        var game = data[i],
            wrapper = document.createElement('div'),
            box = document.createElement('img');
        
        wrapper.className = 'game';
        box.src = '../cache/images/' + game.title_id + '/box.jpg';
        wrapper.appendChild(box);
        //
        
        games_lib.appendChild(wrapper);
    }
});

addEvent(window, 'load', function() {
    ipcRenderer.send('init');
});

(function() {
})()


function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}