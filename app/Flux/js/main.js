ipcRenderer = window.ipcRenderer; // Gets ipcRenderer
var games_lib = document.querySelector('#library'),
    recents_lib = document.querySelector('#recent'),
    modal_list  = document.querySelector('#modal-content-list'),
    modal_open = false,
    clicks = 0,
    emulators_list;

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

addEvent(document.getElementById('menu_button'),'click',function() {
    ipcRenderer.send('open_menu');
});

ipcRenderer.on('emulator_list', function(event, data) {
    emulators_list = data;
});

ipcRenderer.on('init_complete', function(event, data) {
    console.log('init main.js flux');
    ipcRenderer.send('theme_finished_loading');
    setTimeout(function () {
        var games = data.library;
        games_lib.innerHTML = '';
        for (var i=0,length = games.length ;i<length;i++) {
            let game = games[i],
                item = document.getElementById("TEMPLATE_GAME_ITEM").content.firstElementChild.cloneNode(true);

            preload(game.grid);
            let tmp_img = new Image();
            tmp_img.src = game.grid;
        
            addEvent(tmp_img, 'load', () => {
                let vibrant = new Vibrant(tmp_img),
                    swatches = vibrant.swatches(),
                    rgba = swatches.Vibrant.getRgb();
                rgba.push(0.2);
                item.querySelector('div').style.backgroundColor = 'rgba(' + rgba[0] + ', ' + rgba[1] + ', ' + rgba[2] + ', ' + rgba[3] + ')';
            });
            createModal(game);
            item.style.backgroundImage = 'url("' + game.grid + '")';
            item.querySelector('p').innerHTML = game.name + ' <span>' + game.region + '</span>';
            item.setAttribute('data-titleid', game.title_id);
            
            addEvent(item, 'click', () => {
                // modal shit here
                openModal(game.title_id);
            });

            games_lib.appendChild(item);
        }

        let recent_sorted = games.sort((a, b) => {
            return b.last_stopped - a.last_stopped;
        });

        recents_lib.innerHTML = '';
        for (var i=0,length = recent_sorted.length ;i<length;i++) {
            let game = recent_sorted[i],
                item = document.getElementById("TEMPLATE_GAME_ITEM").content.firstElementChild.cloneNode(true);

            preload(game.grid);
            let tmp_img = new Image();
            tmp_img.src = game.grid;
        
            addEvent(tmp_img, 'load', () => {
                let vibrant = new Vibrant(tmp_img),
                    swatches = vibrant.swatches(),
                    rgba = swatches.Vibrant.getRgb();
                rgba.push(0.2);
                item.querySelector('div').style.backgroundColor = 'rgba(' + rgba[0] + ', ' + rgba[1] + ', ' + rgba[2] + ', ' + rgba[3] + ')';
            });
            item.style.backgroundImage = 'url("' + game.grid + '")';
            item.querySelector('p').innerHTML = game.name + ' <span>' + game.region + '</span>';

            addEvent(item, 'click', () => {
                // modal shit here
                openModal(game.title_id);
            });

            recents_lib.appendChild(item);
        }
    }, 0);
});

ipcRenderer.send('init');



function preload(url) {
    heavyImage = new Image();
    heavyImage.src = url;
}

function openModal(tid) {
    document.getElementById(tid).classList.remove('hidden');
    document.getElementById(tid).classList.add('active');
}

function closeModal() {
    document.querySelector('.game_modal.active').classList.add('hidden');
    document.querySelector('.game_modal.active').classList.remove('active');
}

function createModal(game) {

    let item = document.getElementById("TEMPLATE_GAME_MODAL").content.firstElementChild.cloneNode(true);

    addEvent(item.querySelector('.close-btn'), 'click', () => {
        closeModal(game.title_id);
    });

    item.id = game.title_id;
    item.classList.add('hidden');
    item.querySelector('.title').innerHTML = game.name;
    item.querySelector('.about').querySelector('p').innerHTML = game.description;
    item.querySelector('.main_content').style.backgroundImage = 'url("' + game.grid + '")';
    item.querySelector('.screenshots').innerHTML = '';
    for (let screenshot of game.screenshots) {
        let img = document.createElement('img');
        img.className = 'screenshot';
        img.src = screenshot;
        item.querySelector('.screenshots').appendChild(img);
    }

    let l_dropdown = item.querySelector('.dropdownbutton.cemudropdown.launchgame'),
        s_dropdown = item.querySelector('.dropdownbutton.cemudropdown.shortcut');
    l_dropdown.querySelector('.items').innerHTML = '';
    s_dropdown.querySelector('.items').innerHTML = '';
    addEvent(l_dropdown.querySelector('.fa'), 'click', () => {
        dropdown(l_dropdown.querySelector('.fa').parentElement);
    });
    addEvent(l_dropdown.querySelector('.play-button'), 'click', () => {
        ipcRenderer.send('play_rom', {
            emu: 'Default',
            rom: game.title_id
        });        
        closeDropdown();
    });
    addEvent(s_dropdown.querySelector('.fa'), 'click', () => {
        dropdown(s_dropdown.querySelector('.fa').parentElement);
    });
    addEvent(s_dropdown.querySelector('.shortcut-button'), 'click', () => {
        ipcRenderer.send('make_shortcut', {
            emu: 'Default',
            rom: game.title_id
        });        
        closeDropdown();
    });
    for (let instance of emulators_list) {
        let l_item = document.createElement('div'),
            s_item = document.createElement('div');
        
        l_item.className = 'item';
        l_item.innerHTML = instance.name;
        addEvent(l_item, 'click', () => {
            ipcRenderer.send('play_rom', {
                emu: instance.name,
                rom: game.title_id
            });        
            closeDropdown();
        });
        l_dropdown.querySelector('.items').appendChild(l_item);

        s_item.className = 'item';
        s_item.innerHTML = instance.name;
        addEvent(s_item, 'click', () => {
            ipcRenderer.send('make_shortcut', {
                emu: instance.name,
                rom: game.title_id
            });        
            closeDropdown();
        });
        s_dropdown.querySelector('.items').appendChild(s_item);
    }

    document.querySelector('.modal_list').appendChild(item);
}

function dropdown(el) {
    var items = el.parentElement.children[1];
    var icon = el.getElementsByClassName('fa').item(0).classList;
    if (items.classList.contains('visible')) {
        closeDropdown();
    } else {
        closeDropdown();
        items.classList.add('visible');
        icon.remove('fa-caret-down');
        icon.add('fa-caret-up');
    }
}

function closeDropdown() {
    var dropdowns = document.getElementsByClassName('visible');
    for (var i = 0; i < dropdowns.length; i++) {
        var icon = dropdowns.item(i).parentElement.getElementsByClassName('fa').item(0).classList;
        dropdowns.item(i).classList.remove('visible');
        icon.remove('fa-caret-up');
        icon.add('fa-caret-down');
    }
}


//FLUX JS

//flux clock
var col = true;
function clock() {
    var time = new Date(),
        hours = time.getHours() % 24,
        minutes = time.getMinutes(),
        mid = 'am';
    if( hours == 0 ) { 
        hours=12;
    }
    else if( hours > 12 ) {
        hours = hours%12;
        mid = 'pm';
    }
    
    
    document.getElementById('clock').innerHTML = harold(hours) + ':' + harold(minutes) + " " + mid;
  
  function harold(standIn) {
    if (standIn < 10) {
      standIn = '0' + standIn
    }
    return standIn;
  }
    
}
clock();
setInterval(clock, 1000);

addEvent(games_lib, 'mousewheel', (event) => {
    games_lib.scrollLeft += -(event.wheelDelta/3);
    return false;
});
addEvent(recents_lib, 'mousewheel', (event) => {
    recents_lib.scrollLeft += -(event.wheelDelta/3);
    return false;
});