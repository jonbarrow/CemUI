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
addEvent(document.getElementsByClassName('dlgames')[0], 'click', function() {
    ipcRenderer.send('change_theme', {
        name: '_dlgames'
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
    addEvent(new_view.contentWindow, 'keypress', function(event) {
        if (event.charCode == 112) {
            ipcRenderer.send('open_dev');
        }
    });
    new_view.contentWindow.ipcRenderer = ipcRenderer;
}
ipcRenderer.on('theme_change',setTheme);
ipcRenderer.send('ask_for_theme');