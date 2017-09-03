const {ipcRenderer} = require('electron'); // Gets ipcRenderer
var games_lib = document.getElementById('games-grid'),
    modal_list  = document.getElementById('modal-content-list');

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

addEvent(document.getElementById('select_cemu').getElementsByClassName('button')[0], 'click', function() {
    ipcRenderer.send('load_cemu_folder');
});

addEvent(document.getElementById('select_games').getElementsByClassName('button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    ipcRenderer.send('load_games_folder');
});


ipcRenderer.on('show_screen', function(event, data) {
    if (data.cemu) {
        openScreen('select_cemu');
    }
    if (data.games) {
        openScreen('select_games');
    }
});

ipcRenderer.on('cemu_folder_loaded', function(event, data) {
    var button = document.getElementById('select_cemu').getElementsByClassName('button')[0];
    console.log(button);
    closeScreen(button);
    setTimeout(function() {
        ipcRenderer.send('init');
    }, 1000);
});

ipcRenderer.on('games_folder_loaded', function(event, data) {
    var button = document.getElementById('select_games').getElementsByClassName('button')[0];
    console.log(button);
    closeScreen(button);
    setTimeout(function() {
        ipcRenderer.send('init');
    }, 1000);
});

ipcRenderer.on('game_folder_loading', function(event, data) {
    var button = document.getElementById('select_games').getElementsByClassName('button')[0];
        spinner = document.createElement('span');
    button.classList.add('disabled');
    button.innerHTML = '(This may take a moment) Downloading game data... ';
    spinner.classList = 'fa fa-spinner fa-spin';
    //$("h5").html("Downloading Game Data...").append('<br><small class=\"text-muted\">(This may take a moment)</small>');
    button.appendChild(spinner);
    
});

ipcRenderer.on('init_complete', function(event, data) {
    for (var i=0;i<data.length;i++) {
        var game = data[i],
            wrapper = document.createElement('div'),
            box = document.createElement('div');

        createModal(game);

        wrapper.setAttribute('data-modal-id', game.title_id);
        wrapper.onclick = function() {
            openModal(this.getAttribute('data-modal-id'));
        }
        wrapper.className = 'grid-item';
        if (i == 0) {
            wrapper.classList.add('highlight');
        }
        box.style.backgroundImage = 'url("../cache/images/' + game.title_id + '/box.jpg")';
        box.classList = 'boxart';
        wrapper.appendChild(box);
        
        games_lib.appendChild(wrapper);
    }
    document.getElementById('main').style.display = 'grid';
});

addEvent(window, 'load', function() {
    ipcRenderer.send('init');
});

function createModal(game) {
    var modal = document.createElement('div'),
        modal_content = document.createElement('div'),
        close = document.createElement('span'),
        modal_grid_game = document.createElement('div'),
        art = document.createElement('div'),
        box = document.createElement('img'),
        title = document.createElement('div'),
        buttons = document.createElement('div'),
        play_button = document.createElement('p'),
        folder_button = document.createElement('p'),
        shortcut_button = document.createElement('p'),
        game_settings_button = document.createElement('p'),
        desc = document.createElement('div'),
        sst = document.createElement('div'),
        screenshots_list = document.createElement('div');



    modal.id = game.title_id;
    modal.classList = 'modal';
    modal.onclick = function(event) {
        closeModal();
    }
    modal_content.classList= 'modal-content';
    modal_content.onclick = function(event) {
        event.stopPropagation();
    }
    close.classList = 'close';
    close.onclick = function() {
        closeModal();
    }
    close.innerHTML = '&times;';
    modal_grid_game.classList = 'modal-grid-game';
    art.classList = 'art';
    box.src = '../cache/images/' + game.title_id + '/box.jpg';
    title.classList = 'title';
    title.innerHTML = '<h2 class="txt-s-32 txt-c-black">' + game.name + '</h2>';
    buttons.classList = 'buttons';
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
        alert('Coming soon');
    }
    desc.classList = 'desc';
    desc.innerHTML = '<p class="txt-s-16 txt-c-gray">' + game.description + '</p>';
    sst.classList = 'ssT';
    sst.innerHTML = '<h2 class="txt-s-24 txt-c-black">Screenshots</h2>';
    screenshots_list.classList = 'ss';

    art.appendChild(box);
    buttons.appendChild(play_button);
    buttons.appendChild(folder_button);
    buttons.appendChild(shortcut_button);
    buttons.appendChild(game_settings_button);
    modal_grid_game.appendChild(art);
    modal_grid_game.appendChild(title);
    modal_grid_game.appendChild(buttons);
    modal_grid_game.appendChild(desc);
    modal_grid_game.appendChild(sst);
    modal_grid_game.appendChild(screenshots_list);
    modal_content.appendChild(close);
    modal_content.appendChild(modal_grid_game);
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
}
function closeScreen(el) {
    el.parentElement.style.opacity = "0";
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
    setTimeout(function () {
        el.style.opacity = "1";
    },100);
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