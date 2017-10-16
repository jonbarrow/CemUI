const {ipcRenderer} = require('electron');
//ipcRenderer.send('open_dev');
function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

ipcRenderer.on('ticket_cache_downloaded', () => {
    document.querySelectorAll('#dl .loading-overlay')[0].classList.add('hidden');
    document.querySelectorAll('#dl .main')[0].classList.remove('hidden');
});

ipcRenderer.on('cached_game', (event, data) => {
    let game = document.createElement('div'),
        inner = document.createElement('div'),
        title = document.createElement('p'),
        expand_btn = document.createElement('span');
    
    game.classList = 'item img-cap-white';
    game.style.backgroundImage = 'url("http://cemui.com/api/v2/image/grid/' + data.titleID + '")'
    title.innerHTML = data.name;
    expand_btn.innerHTML = 'More';

    title.appendChild(expand_btn);
    inner.appendChild(title);
    game.appendChild(inner);
    document.querySelectorAll('#dl .main')[0].appendChild(game);
});

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
addEvent(document.getElementsByClassName('dlgames')[0], 'click', toggleGAMES );
addEvent(document.getElementsByClassName('smmdb')[0], 'click', toggleSMMDB );

function toggleSMMDB() {
    var el = document.getElementById('smm');
    if (el.style.display == "block") {
        el.style.display = 'none';
        el.querySelector('.main').style.display = 'none';
        el.querySelector('.overlay > div:first-child').style.right = '100%';
        el.querySelector('.overlay > div:nth-child(2)').style.left = '100%';
        el.querySelector('.overlay > div:first-child').style.top = '0%';
        el.querySelector('.overlay > div:nth-child(2)').style.bottom = '0%';
    } else {
        el.style.display = 'block';
        el.querySelector('.overlay').style.display = 'block';
        setTimeout(function () {
            var el = document.getElementById('smm');
            el.querySelector('.overlay > div:first-child').style.right = '0%';
            el.querySelector('.overlay > div:nth-child(2)').style.left = '0%';
            setTimeout(function () {
                var el = document.getElementById('smm');
                el.querySelector('.main').style.display = 'flex';
                el.querySelector('.overlay > div:first-child').style.top = '-50%';
                el.querySelector('.overlay > div:nth-child(2)').style.bottom = '-50%';
                setTimeout(function () {
                    var el = document.getElementById('smm');
                    el.querySelector('.overlay').style.display = 'none';
                },500);
            },800);
        },0);
    }
}

function toggleGAMES() {
    var el = document.getElementById('dl');
    if (el.style.display == "flex") {
        el.style.display = 'none';
        return;
    }
    
    el.style.display = 'flex';
    el.getElementsByClassName('main')[0].innerHTML = '';
    ipcRenderer.send('init', {
        page: '_dlgames'
    });
}

/*addEvent(document.getElementsByClassName('dlgames')[0], 'click', function() {
    ipcRenderer.send('change_theme', {
        name: '_dlgames'
    });
});*/
            
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
    addEvent(new_view.contentWindow, 'keypress', function(event) {
        if (event.charCode == 112) {
            ipcRenderer.send('open_dev');
        }
    });
    new_view.contentWindow.ipcRenderer = ipcRenderer;
}
ipcRenderer.on('theme_change',setTheme);
ipcRenderer.send('ask_for_theme');

String.prototype.insert = function(index, string) {
    if (index > 0) {
        return this.substring(0, index) + string + this.substring(index, this.length);
    } else {
        return string + this;
    }
};