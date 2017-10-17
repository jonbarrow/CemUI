let ipcRenderer = window.ipcRenderer;

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

ipcRenderer.on('ticket_cache_downloaded', () => {
    document.getElementsByClassName('loading-overlay')[0].classList.add('hidden');
    document.getElementsByClassName('games')[0].classList.remove('hidden');
});

ipcRenderer.on('cached_game', (event, data) => {
    console.log(data.titleID)
    let game = document.createElement('div'),
        box = document.createElement('img'),
        game_content = document.createElement('div'),
        game_footer = document.createElement('div');

    game.classList.add('game');
    box.classList.add('box');
    game_content.classList.add('game-content');
    game_footer.classList.add('game-footer');

    box.onerror = function () {
        this.src = '../../defaults/box.jpg';
    };
    
    box.src = 'http://cemui.com/api/v2/image/boxart/' + data.titleID.toUpperCase().insert(8, '-');

    game_content.innerHTML = '<h4><b>' + data.name  + ' (' + data.region + ')</b></h4>';
    game_footer.innerHTML = '<p><button class="game-dl-btn">DOWNLOAD</button></p>';

    game.appendChild(box);
    game.appendChild(game_content);
    game.appendChild(game_footer);
    document.getElementsByClassName('games')[0].appendChild(game);

});

addEvent(window, 'load', function() {
    document.getElementsByClassName('games')[0].innerHTML = '';
    ipcRenderer.send('init', {
        page: '_dlgames'
    });
});

String.prototype.insert = function(index, string) {
    if (index > 0) {
        return this.substring(0, index) + string + this.substring(index, this.length);
    } else {
        return string + this;
    }
};