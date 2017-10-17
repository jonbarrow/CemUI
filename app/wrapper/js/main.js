const {ipcRenderer} = require('electron');
//ipcRenderer.send('open_dev');
function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

ipcRenderer.on('smm_courses_list', (event, data) => {
    for (var level of data) {
        let level_wrapper = document.getElementById("TEMPLATE_SMMDB_COURSE").content.firstElementChild.cloneNode(true);
        /*
            DO STUFF WITH DATA
        */
    }
});

ipcRenderer.on('ticket_cache_downloaded', () => {
    document.querySelectorAll('#dl .loading-overlay')[0].classList.add('hidden');
    document.querySelectorAll('#dl .main')[0].classList.remove('hidden');
});

ipcRenderer.on('cached_game', (event, data) => {
    const tid = data.titleID.slice(0, 8) + "-" + data.titleID.slice(8);
    let bg_test = new Image(),
        src = 'http://cemui.com/api/v2/image/boxart/' + tid;
    
    let item = document.getElementById("TEMPLATE_DL_GRID").content.firstElementChild.cloneNode(true);

    bg_test.onerror = function () {
        item.querySelector('img').src = "../../defaults/box.jpg";
    };

    bg_test.src = src;
    
    item.querySelector('img').src = src;
    item.querySelector('.title').innerHTML = data.name;
    item.querySelector('.desc').innerHTML = "lorem ipsum description.";

    document.querySelectorAll('#dl .main')[0].appendChild(item);
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
        ipcRenderer.send('smm_search_courses', {});
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