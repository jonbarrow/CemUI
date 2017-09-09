const {ipcRenderer} = require('electron'); // Gets ipcRenderer
var games_lib = document.getElementById('games-grid'),
    modal_list  = document.getElementById('modal-content-list'),
    modal_open = false,
    clicks = 0;

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

addEvent(window, 'keypress', function(event) {
    if (event.charCode == 112) {
        ipcRenderer.send('open_dev');
    }
});

addEvent(document.getElementById('select_cemu').getElementsByClassName('button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    this.classList.add('disabled');
    ipcRenderer.send('load_cemu_folder');
});

addEvent(document.getElementById('select_games').getElementsByClassName('button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    ipcRenderer.send('load_games_folder');
});


ipcRenderer.on('show_screen', function(event, data) {
    document.getElementById('screen_start').style.display = "none";
    document.getElementById('select_games').style.display = "none";
    document.getElementById('select_cemu').style.display = "none";
    if (data.cemu) {
        openScreen('select_cemu');
    }
    if (data.games) {
        openScreen('select_games');
    }
    if (data.welcome){
        openScreen('screen_start');
    }
});

ipcRenderer.on('cemu_folder_loaded', function(event, data) {
    var button = document.getElementById('select_cemu').getElementsByClassName('button')[0];
    console.log(button);
    setTimeout(function () {
        closeScreen(document.getElementById('select_cemu').getElementsByClassName('button')[0]);
    },1000);
});

ipcRenderer.on('games_folder_loaded', function(event, data) {
    var button = document.getElementById('select_games').getElementsByClassName('button')[0];
    console.log(button);
    closeScreen(button);
});

ipcRenderer.on('game_folder_loading', function(event, data) {
    var button = document.getElementById('select_games').getElementsByClassName('button')[0];
        spinner = document.createElement('span');
    button.classList.add('disabled');
    button.innerHTML = '(This may take a moment) Downloading game data... ';
    spinner.classList = 'fa fa-spinner fa-spin';
    button.appendChild(spinner);
    
});

ipcRenderer.on('init_complete', function(event, data) {
    var games = data.library;
    for (var i=0,length = games.length ;i<length;i++) {
        var game = games[i],
            wrapper = document.createElement('div'),
            fav = document.createElement('i'),
            box = document.createElement('div');

        createModal(game);

        wrapper.setAttribute('data-modal-id', game.title_id);
        wrapper.className = 'grid-item';
        
        if (game.is_favorite) {
            wrapper.classList.add('highlight');
            fav.classList = 'txt-s-24 fa fa-times grid-icon favicon';
        } else {
            fav.classList = 'txt-s-16 fa fa-star grid-icon favicon';
        }
        fav.setAttribute('aria-hidden','true');
        fav.onclick = function () {
            updateFavorite(this);
        }
        
        box.style.backgroundImage = 'url("' + game.boxart + '")';
        box.classList = 'boxart';
        box.onclick = function() {
            clicks++;
            if (clicks === 1) {
                clicktimer = setTimeout(function() {
                    clicks = 0;
                    closeExpandModal(document.getElementById(this.parentElement.getAttribute('data-modal-id')).children[0].children[1]);
                    openModal(this.parentElement.getAttribute('data-modal-id'));
                }.bind(this), 400);
            } else if (clicks === 2) {
                clearTimeout(clicktimer);
                clicks = 0;
                ipcRenderer.send('play_rom', this.parentElement.getAttribute('data-modal-id'));
            }
        }
        
        wrapper.appendChild(fav);
        wrapper.appendChild(box);
        
        games_lib.appendChild(wrapper);
    }
    
    addToGrid(data.suggested,'suggest_grid');
    addToGrid(data.most_played,'most_grid');
    
    var count = games.length;
    var high = document.getElementsByClassName('highlight')[0];
        if (typeof high != 'undefined') {
            count = count + 3;
        }
    count = 15 - count;
    for (var i=0;i<count;i++) {
        var item = document.createElement('div');
        item.classList = "grid-item filler-grid-item";
        games_lib.appendChild(item);
    }
    
    document.getElementById('main').style.display = 'grid';
    /*
    ipcRenderer.send('smm_search_courses', {
        title: 'sand'
    });
    */
});

addEvent(window, 'load', function() {
    ipcRenderer.send('init');
});

function addToGrid(arr,id) {
    var children = document.getElementById(id).children;
    for (var i=0,length = children.length ;i<length;i++) {
        if (typeof arr[i] != 'undefined') {

            var wrapper = children[i],
                box = document.createElement('div'),
                game = arr[i];

            if (typeof game.game_boxart_url == 'undefined') {
                box.style.backgroundImage = 'url("' + game.boxart + '")';
                wrapper.setAttribute('data-modal-id', game.title_id);
            } else {
                box.style.backgroundImage = 'url("' + game.game_boxart_url + '")';
                wrapper.setAttribute('data-modal-id', game.game_title_id);
                createModal(game,true);
            }
            box.classList = 'boxart';
            box.onclick = function() {
                openModal(this.parentElement.getAttribute('data-modal-id'));
            }

            wrapper.appendChild(box);
        }
    }
}

function createModal(game,isSuggest) {
    var modal = document.createElement('div'),
        modal_content = document.createElement('div'),
        close = document.createElement('span'),
        modal_grid_game = document.createElement('div'),
        modal_grid_game_settings = document.createElement('div'),
        art = document.createElement('div'),
        box = document.createElement('img'),
        title = document.createElement('div'),
        buttons = document.createElement('div'),
        desc = document.createElement('div'),
        sst = document.createElement('div'),
        screenshots_list = document.createElement('div');


    if (isSuggest) {
        var visit_button = document.createElement('a');
        title.innerHTML = '<h2 class="txt-s-32 txt-c-black">' + game.game_title_clean + '</h2>';
        box.src = game.game_boxart_url;
        visit_button.classList = 'txt-s-16 txt-bold button button-small';
        visit_button.innerHTML = 'Visit game website';
        visit_button.href = 'http://www.nintendo.com/games/detail/' + game.game_slug;
        visit_button.target = '_blank';
        desc.innerHTML = '<p class="txt-s-16 txt-c-gray">' + game.game_overview + '</p>';
        desc.innerHTML += '<br><h2 class="txt-s-16 txt-c-black">Playability</h2>';
        desc.innerHTML += '<p class="txt-s-16 txt-c-gray">' + game.game_playability + '</p>';
        modal.id = game.game_title_id;
    } else {
        var play_button = document.createElement('p'),
            folder_button = document.createElement('p'),
            shortcut_button = document.createElement('p'),
            game_settings_button = document.createElement('p'),
            settingsartcontainer = document.createElement('div'),
            settingsart = document.createElement('img'),
            sect1 = document.createElement('div'),
            sect1back = document.createElement('div'),
            sect2 = document.createElement('div');
        
        modal_grid_game_settings.classList = "modal-grid-game-settings";
        settingsart.src = game.boxart;
        settingsartcontainer.classList = "art";
        sect1.classList = "sect1";
        sect2.classList = "sect2";
        
        sect1back.innerHTML = "<p>back</p>";
        sect1back.classList = "txt-s-16 txt-bold button button-small";
        sect1back.onclick = function() {
            closeExpandModal(this.parentElement.parentElement.parentElement.children[1]);
        }
        
        sect1.appendChild(sect1back);
        //sect1.innerHTML += '<h2 class="txt-s-32 txt-c-black">Settings</h2>';
        
        
        title.innerHTML = '<h2 class="txt-s-32 txt-c-black">' + game.name + '</h2>';
        play_button.classList = 'txt-s-16 txt-bold button button-small play-button';
        play_button.innerHTML = 'Play';
        play_button.onclick = function() {
            ipcRenderer.send('play_rom', this.parentElement.parentElement.parentElement.parentElement.id);
        }
        folder_button.classList = 'txt-s-16 txt-bold button button-small folder-button';
        folder_button.innerHTML = 'Show in folder';
        folder_button.onclick = function() {
            ipcRenderer.send('show_rom', this.parentElement.parentElement.parentElement.parentElement.id);
        }
        shortcut_button.classList = 'txt-s-16 txt-bold button button-small shortcut-button';
        shortcut_button.innerHTML = 'Create desktop shortcut';
        shortcut_button.onclick = function() {
            ipcRenderer.send('make_shortcut', this.parentElement.parentElement.parentElement.parentElement.id);
        }
        game_settings_button.classList = 'txt-s-16 txt-bold button button-small game-settings-button';
        game_settings_button.innerHTML = 'Settings';
        game_settings_button.onclick = function() {
            expandModal(this);
        }
        box.src = game.boxart;
        desc.innerHTML = '<p class="txt-s-16 txt-c-gray">' + game.description + '</p>';
        modal.id = game.title_id;
    }
    modal.classList = 'modal';
    modal.onclick = function(event) {
        closeModal();
    }
    modal_content.classList= 'modal-content';
    modal_content.onclick = function(event) {
        event.stopPropagation();
    }
    close.classList = 'close txt-s-24';
    close.onclick = function() {
        closeModal();
    }
    close.innerHTML = '&times;';
    modal_grid_game.classList = 'modal-grid-game';
    modal_grid_game.style.position = "relative";
    modal_grid_game.style.left = "0";
    art.classList = 'art';
    title.classList = 'title';
    buttons.classList = 'buttons';
    desc.classList = 'desc';
    sst.classList = 'ssT';
    sst.innerHTML = '<h2 class="txt-s-24 txt-c-black">Screenshots</h2>';
    screenshots_list.classList = 'ss';

    if (!isSuggest) {
        for (var i=0;i<game.screenshots.length;i++) {
            var screenshot_url = game.screenshots[i],
                screenshot = document.createElement('img');
            screenshot.src  = screenshot_url;
            screenshot.classList = 'screenshot';
            
            screenshots_list.appendChild(screenshot);
        }
    }
        
    if (isSuggest) {
        buttons.appendChild(visit_button);
    } else {
        buttons.appendChild(play_button);
        buttons.appendChild(folder_button);
        buttons.appendChild(shortcut_button);
        buttons.appendChild(game_settings_button);
        modal_grid_game_settings.style.position = "absolute";
        modal_grid_game_settings.style.left = "100%";
        modal_grid_game_settings.style.top = "0";
        settingsartcontainer.appendChild(settingsart);
        modal_grid_game_settings.appendChild(settingsartcontainer);
        modal_grid_game_settings.appendChild(sect1);
        modal_grid_game_settings.appendChild(sect2);
    }
    art.appendChild(box);
    modal_grid_game.appendChild(art);
    modal_grid_game.appendChild(title);
    modal_grid_game.appendChild(buttons);
    modal_grid_game.appendChild(desc);
    modal_grid_game.appendChild(sst);
    modal_grid_game.appendChild(screenshots_list);
    modal_content.appendChild(close);
    modal_content.appendChild(modal_grid_game);
    if (!isSuggest) {
        modal_content.appendChild(modal_grid_game_settings);
    }
    modal.appendChild(modal_content);

    modal_list.appendChild(modal);
}
function closeModal() {
    var modal = document.getElementsByClassName('selected-modal')[0];
    modal.style.opacity = "0";
    setTimeout(function () {
        document.getElementsByClassName('selected-modal')[0].style.display = "none";
        document.getElementsByClassName('selected-modal')[0].classList.remove('selected-modal');
    },500);
    document.getElementById('main').style.filter = 'blur(0px)';
    modal_open = false;
}
function openModal(id) {
    if (document.getElementsByClassName('selected-modal').length > 0) closeModal();
    var modal = document.getElementById(id);
    modal.style.opacity = "0";
    modal.style.display = "block";
    modal.classList.add('selected-modal');
    setTimeout(function () {
        modal.style.opacity = "1";
    },250);
    document.getElementById('main').style.filter = 'blur(3px)';
    modal_open = true;
}
function expandModal(el) {
    var grid = el.parentElement.parentElement;
    var expandgrid = grid.parentElement.children[2];
    grid.style.left = "-100%";
    expandgrid.style.left = "0";
}
function closeExpandModal(el) {
    console.log("closing");
    var grid = el;
    var expandgrid = grid.parentElement.children[2];
    grid.style.left = "0";
    expandgrid.style.left = "100%";
}
function closeScreen(el) {
    el.parentElement.style.opacity = "0";
    el.parentElement.parentElement.classList.add('closed');
    if (document.getElementById('screen_start').classList.contains('closed') &&
        document.getElementById('select_games').classList.contains('closed') &&
        document.getElementById('select_cemu').classList.contains('closed')) {
        ipcRenderer.send('init');
    }
    setTimeout(function () {
        el.parentElement.parentElement.style.opacity = "0";
        setTimeout(function () {
            el.parentElement.parentElement.style.display = "none";
            el.parentElement.style.opacity = "1";
        },1000);
    },750);
}
function openScreen(id) {
    var el = document.getElementById(id);
    el.style.display = "inline-block";
    el.classList.remove('closed');
    setTimeout(function () {
        el.style.opacity = "1";
    },100);
}

function updateFavorite(el) {
    if(el.parentElement.classList.contains('highlight')) {
        removeFavorite(el);
    } else {
        var high = document.getElementsByClassName('highlight')[0];
        if (typeof high != 'undefined') {
            var icon = high.children[0];
            removeFavorite(icon);
        }
        setFavorite(el);
    }
}

function removeFavorite(el) {
    el.classList.remove('fa-times');
    el.classList.remove('txt-s-24');
    el.classList.add('fa-star');
    el.classList.remove('txt-s-16');
    el.parentElement.classList.remove('highlight');
    var count = 15 - games_lib.children.length;
    for (var i=0;i<count;i++) {
        var item = document.createElement('div');
        item.classList = "grid-item filler-grid-item";
        games_lib.appendChild(item);
    }
    ipcRenderer.send('remove_favorite', el.parentElement.getAttribute('data-modal-id'));
}

function setFavorite(el) {
    el.classList.remove('fa-star');
    el.classList.remove('txt-s-16');
    el.classList.add('fa-times');
    el.classList.add('txt-s-24');
    el.parentElement.classList.add('highlight');
    var items = document.getElementsByClassName('filler-grid-item');
    if (items.length > 0) {
        try {
            games_lib.removeChild(items[0]);
            games_lib.removeChild(items[1]);
            games_lib.removeChild(items[2]);
        } catch(ex) {
            console.log(ex)
        }
    }
    ipcRenderer.send('set_favorite', el.parentElement.getAttribute('data-modal-id'));
}

var modalList = document.getElementsByClassName('modal');
for(var i = 0, length = modalList.length; i < length; i++)
{
    modalList.item(i).onclick = function(event) {
        closeModal();
    }
}

var modalchildList = document.getElementsByClassName('modal-content');
for(var i = 0, length = modalchildList.length; i < length; i++)
{
    modalchildList.item(i).onclick = function(event) {
        event.stopPropagation();
    }
}


var closeList = document.getElementsByClassName('close');
for(var i = 0, length = closeList.length; i < length; i++)
{
    closeList.item(i).onclick = function() {
        closeModal();
    }
}