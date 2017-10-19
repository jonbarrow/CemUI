ipcRenderer = window.ipcRenderer; // Gets ipcRenderer
var games_lib = document.getElementById('games'),
    modal_list  = document.getElementById('modal-content-list'),
    modal_open = false,
    clicks = 0,
    emulators_list;

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

/*
addEvent(document.getElementById('select_cemu').getElementsByClassName('button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    this.classList.add('disabled');
    ipcRenderer.send('load_cemu_folder');
});
*/

/*
addEvent(document.getElementById('select_games').getElementsByClassName('button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    ipcRenderer.send('load_games_folder');
});
*/

ipcRenderer.on('emulator_list', function(event, data) {
    emulators_list = data;
})

/*
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
*/

/*
ipcRenderer.on('update_status',function(e,data) {
    
    if (data.type == "available") {
        openScreen('screen_update');
        document.getElementById('update_txt').innerHTML = "Update available";
        document.getElementById('update_button').innerHTML = "Start updating";
        document.getElementById('update_button').onclick = function () {
            ipcRenderer.send('download_update');
            this.onclick = "";
            this.innerHTML = "downloading";
        };
    } else if (data.type == "progress")  {
        document.getElementById('update_txt').innerHTML = "Loading";
        document.getElementById('progress_update').style.width = data.progress.percent + '%';
        console.log(data.progress);
    } else if (data.type == "completed") {
        document.getElementById('update_txt').innerHTML = "Applying update";
        document.getElementById('update_button').innerHTML = "applying";
        document.getElementById('update_button').onclick = '';
        ipcRenderer.send('apply_update');
    }
    
});
*/

/*
ipcRenderer.on('cemu_folder_loaded', function(event, data) {
    var button = document.getElementById('select_cemu').getElementsByClassName('button')[0];
    console.log(button);
    setTimeout(function () {
        closeScreen(document.getElementById('select_cemu').getElementsByClassName('button')[0]);
    },1000);
});
*/

/*
ipcRenderer.on('games_folder_loaded', function(event, data) {
    var button = document.getElementById('select_games').getElementsByClassName('button')[0];
    console.log(button);
    closeScreen(button);
});
*/

/*
ipcRenderer.on('game_folder_loading', function(event, data) {
    var button = document.getElementById('select_games').getElementsByClassName('button')[0];
        spinner = document.createElement('span');
    button.classList.add('disabled');
    button.innerHTML = '(This may take a moment) Downloading game data... ';
    spinner.classList = 'fa fa-spinner fa-spin';
    button.appendChild(spinner);
    
});
*/

ipcRenderer.on('init_complete', function(event, data) {
    console.log('init main.js flux');
    ipcRenderer.send('theme_finished_loading'); 
    setTimeout(function () {
        var games = data.library;
        for (var i=0,length = games.length ;i<length;i++) {
            var game = games[i],
                wrapper = document.createElement('div'),
                box = document.createElement('div');

            wrapper.setAttribute('data-modal-id', game.title_id);
            wrapper.className = 'grid-item';

            preload(game.boxart);
            box.style.backgroundImage = 'url("' + game.grid + '")';
            box.classList = 'game';
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

            wrapper.appendChild(box);

            //games_lib.appendChild(wrapper);
        }

        //addToGrid(data.suggested,'suggest_grid');
        //addToGrid(data.most_played,'most_grid');

        var count = games.length;
        count = 16 - count;
        for (var i=0;i<count;i++) {
            var item = document.createElement('div');
            item.classList = "grid-item filler-grid-item";
            item.innerHTML = "<div class='game'></div>"
            games_lib.appendChild(item);
        }
        /*
        document.getElementById('main').style.display = 'grid';
        openModal('modal1');
        
        setTimeout(function () {
            closeModal();
        },1000);
        */
    // This was 2000, but the timeout above was removed so i added the 1000 here

        //createCemuDropdowns();
        
    },0);
});

    ipcRenderer.send('init');

/*
function addToGrid(arr,id) {
    var children = document.getElementById(id).children;
    for (var i=0,length = children.length ;i<length;i++) {
        if (typeof arr[i] != 'undefined') {

            var wrapper = children[i],
                box = document.createElement('div'),
                game = arr[i];
            
            if (typeof game.game_boxart_url == 'undefined') {
                preload(game.boxart);
                box.style.backgroundImage = 'url("' + game.boxart + '")';
                wrapper.setAttribute('data-modal-id', game.title_id);
            } else {
                preload(game.game_boxart_url);
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
*/

/*
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
*/

function preload(url) {
    heavyImage = new Image();
    heavyImage.src = url;
}

/*
function createCemuDropdowns() {
    var dropdown_list = document.getElementsByClassName('dropdownbutton cemudropdown launchgame');
    for (var i=0;i<dropdown_list.length;i++) {
        var items = dropdown_list[i].getElementsByClassName('items')[0];
        items.innerHTML = '';
        for (var j=0;j<emulators_list.length;j++) {
            var emulator = emulators_list[j],
                item = document.createElement('div');
            
            item.className = 'item';
            item.innerHTML = emulator.name;
            item.onclick = function() {
                ipcRenderer.send('play_rom', {emu: emulator.name, rom: this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id});        
                closeDropdown();
            }

            items.appendChild(item)
        }
    }

    var dropdown_list = document.getElementsByClassName('dropdownbutton cemudropdown shortcut');
    for (var i=0;i<dropdown_list.length;i++) {
        var items = dropdown_list[i].getElementsByClassName('items')[0];
        items.innerHTML = '';
        for (var j=0;j<emulators_list.length;j++) {
            var emulator = emulators_list[j],
                item = document.createElement('div');
            
            item.className = 'item';
            item.innerHTML = emulator.name;
            item.onclick = function() {
                ipcRenderer.send('make_shortcut', {emu: emulator.name, rom: this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id});        
                closeDropdown();
            }

            items.appendChild(item)
        }
    }
}
*/

/*
function createModal(game, isSuggest) {
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
        var play_button = document.createElement('div'),
            folder_button = document.createElement('p'),
            shortcut_button = document.createElement('p'),
            game_settings_button = document.createElement('p'),
            settingsartcontainer = document.createElement('div'),
            settingsart = document.createElement('img'),
            sect1 = document.createElement('div'),
            sect1back = document.createElement('div'),
            sect1sett = document.createElement('div'),
            sect2 = document.createElement('div');
        
        
        modal_grid_game_settings.classList = "modal-grid-game-settings";
        settingsart.src = game.boxart;
        settingsartcontainer.classList = "art";
        settingsartcontainer.style.width = "80%";
        settingsartcontainer.style.paddingLeft = "20%";
        sect1.classList = "sect1";
        sect2.classList = "sect2";
        
        sect2.innerHTML += "<p class='txt-s-16 txt-c-gray' style='opacity: 0;display: inline-block'>back</p><h2 style='opacity: 0;' class=\"txt-s-48 txt-c-black\">Settings</h2>";
        sect1.innerHTML += "<p class='txt-s-16 txt-c-gray txt-hover' style='display: inline-block' onclick='closeExpandModal(this.parentElement.parentElement.parentElement.children[1]);'>back</p>";
        sect1.innerHTML += '<h2 class="txt-s-48 txt-c-black">Settings</h2>';
        sect1.innerHTML += '<p class="txt-bold txt-s-16 txt-c-black" style="padding-top: 10px;">Graphics</p>';   
        
        var toggle = document.createElement('input'),
            togglebtn = document.createElement('label'),
            toggleid = "shadermul";
        
        toggle.classList = "tgl tgl-light";
        toggle.id = toggleid;
        toggle.setAttribute('type','checkbox');
        togglebtn.classList = "tgl-btn";
        togglebtn.setAttribute('for',toggleid);
        sect1.innerHTML += '<p class="txt-s-16 txt-c-black" style="padding-top: 10px;">Accurate shader MUL emulation</p>';
        sect1.appendChild(toggle);
        sect1.appendChild(togglebtn);
        
        var toggle = document.createElement('input'),
            togglebtn = document.createElement('label'),
            toggleid = "gpufence";
        
        toggle.classList = "tgl tgl-light";
        toggle.id = toggleid;
        toggle.setAttribute('type','checkbox');
        togglebtn.classList = "tgl-btn";
        togglebtn.setAttribute('for',toggleid);
        sect1.innerHTML += '<p class="txt-s-16 txt-c-black" style="padding-top: 10px;">disable GPU fence</p>';
        sect1.appendChild(toggle);
        sect1.appendChild(togglebtn);
        
        var _dropdown = document.createElement('div'),
            dropdownhead = document.createElement('div'),
            dropdownitems = document.createElement('div');
         
        _dropdown.classList = "dropdown";
        dropdownhead.classList = "head txt-s-16 txt-c-black";
        dropdownhead.setAttribute("onclick","dropdown(this);");
        dropdownhead.innerHTML = '<p><i class="fa fa-caret-down" aria-hidden="true"></i> <span>high</span></p>';
        dropdownitems.classList = "items txt-s-16 txt-c-black";
        dropdownitems.innerHTML += '<div class="item">high</div>';
        dropdownitems.innerHTML += '<div class="item">medium</div>';
        dropdownitems.innerHTML += '<div class="item">low</div>';
        _dropdown.appendChild(dropdownhead);
        _dropdown.appendChild(dropdownitems);
        sect1.innerHTML += '<p class="txt-s-16 txt-c-black" style="padding-top: 10px;">GPU buffer cache accuracy</p>';
        sect1.appendChild(_dropdown);
        
        sect2.innerHTML += '<p class="txt-bold txt-s-16 txt-c-black" style="padding-top: 10px;">CPU</p>';
        
        var _dropdown = document.createElement('div'),
            dropdownhead = document.createElement('div'),
            dropdownitems = document.createElement('div');
         
        _dropdown.classList = "dropdown";
        dropdownhead.classList = "head txt-s-16 txt-c-black";
        dropdownhead.setAttribute("onclick","dropdown(this);");
        dropdownhead.innerHTML = '<p><i class="fa fa-caret-down" aria-hidden="true"></i> <span>cycle counter</span></p>';
        dropdownitems.classList = "items txt-s-16 txt-c-black";
        dropdownitems.innerHTML += '<div class="item">host based</div>';
        dropdownitems.innerHTML += '<div class="item">cycle counter</div>';
        _dropdown.appendChild(dropdownhead);
        _dropdown.appendChild(dropdownitems);
        sect2.innerHTML += '<p class="txt-s-16 txt-c-black" style="padding-top: 10px;">CPU timer</p>';
        sect2.appendChild(_dropdown);
        
        var toggle = document.createElement('input'),
            togglebtn = document.createElement('label'),
            toggleid = "singleprecision";
        
        toggle.classList = "tgl tgl-light";
        toggle.id = toggleid;
        toggle.setAttribute('type','checkbox');
        togglebtn.classList = "tgl-btn";
        togglebtn.setAttribute('for',toggleid);
        sect2.innerHTML += '<p class="txt-s-16 txt-c-black" style="padding-top: 10px;">Emulate single precision</p>';
        sect2.appendChild(toggle);
        sect2.appendChild(togglebtn);
        
        sect2.innerHTML += '<p class="txt-bold txt-s-16 txt-c-black" style="padding-top: 10px;">Audio</p>';
        
        var toggle = document.createElement('input'),
            togglebtn = document.createElement('label'),
            toggleid = "disableaudio";
        
        toggle.classList = "tgl tgl-light";
        toggle.id = toggleid;
        toggle.setAttribute('type','checkbox');
        togglebtn.classList = "tgl-btn";
        togglebtn.setAttribute('for',toggleid);
        sect2.innerHTML += '<p class="txt-s-16 txt-c-black" style="padding-top: 10px;">Disable audio</p>';
        sect2.appendChild(toggle);
        sect2.appendChild(togglebtn);
        
        
        
        var dropdownhead = document.createElement('div'),
            dropdownitems = document.createElement('div'),
            dropdownbutton =  document.createElement('p'),
            dropdownicon = document.createElement('i');
         
        play_button.classList = "dropdownbutton cemudropdown launchgame";
        dropdownhead.classList = "head txt-s-16 txt-c-black";
        dropdownbutton.classList = 'txt-s-16 txt-bold button button-small button-left play-button';
        dropdownbutton.innerHTML = 'Play';
        dropdownbutton.onclick = function() {
            ipcRenderer.send('play_rom', {emu: 'Default', rom: this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id});
        }
        dropdownicon.classList = "button button-small button-right fa fa-caret-down";
        dropdownicon.setAttribute('aria-hidden','true');
        dropdownicon.onclick = function () {
            dropdown(this.parentElement);
        };
        
        dropdownhead.appendChild(dropdownbutton);
        dropdownhead.appendChild(dropdownicon);
        dropdownitems.classList = "items txt-s-16 txt-c-black";
        dropdownitems.innerHTML += '<div class="item">item 1</div>';
        dropdownitems.innerHTML += '<div class="item">item 2</div>';
        play_button.appendChild(dropdownhead);
        play_button.appendChild(dropdownitems);
        
        title.innerHTML = '<h2 class="txt-s-32 txt-c-black">' + game.name + '</h2>';
        folder_button.classList = 'txt-s-16 txt-bold button button-small folder-button';
        folder_button.innerHTML = 'Show in folder';
        folder_button.onclick = function() {
            ipcRenderer.send('show_rom', this.parentElement.parentElement.parentElement.parentElement.id);
        }
         var dropdownhead = document.createElement('div'),
            dropdownitems = document.createElement('div'),
            dropdownbutton =  document.createElement('p'),
            dropdownicon = document.createElement('i');
         
        shortcut_button.classList = "dropdownbutton cemudropdown shortcut";
        dropdownhead.classList = "head txt-s-16 txt-c-black";
        dropdownbutton.classList = 'txt-s-16 txt-bold button button-small button-left shortcut-button';
        dropdownbutton.innerHTML = 'Create desktop shortcut';
        dropdownbutton.onclick = function() {
            ipcRenderer.send('make_shortcut', {emu: 'Default', rom: this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id});
        }
        dropdownicon.classList = "button button-small button-right fa fa-caret-down";
        dropdownicon.setAttribute('aria-hidden','true');
        dropdownicon.onclick = function () {
            dropdown(this.parentElement);
        };
        
        dropdownhead.appendChild(dropdownbutton);
        dropdownhead.appendChild(dropdownicon);
        dropdownitems.classList = "items txt-s-16 txt-c-black";
        dropdownitems.innerHTML += '<div class="item">item 1</div>';
        dropdownitems.innerHTML += '<div class="item">item 2</div>';
        shortcut_button.appendChild(dropdownhead);
        shortcut_button.appendChild(dropdownitems);
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

            screenshot.onclick = function() {
                if (this.className.match(/\bactive\b/)) {
                    this.classList.remove('active');
                } else {
                    var actives = document.getElementsByClassName('screenshot active');
                    for (var j=0;j<actives.length;j++) {
                        var active = actives[j];
                        active.classList.remove('active');
                    }
                    this.classList.add('active');
                }
            }
            
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
    document.getElementById('main').classList.remove('blur');
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
    document.getElementById('main').classList.add('blur');
    modal_open = true;
}
function expandModal(el) {
    var grid = el.parentElement.parentElement;
    var expandgrid = grid.parentElement.children[2];
    grid.style.left = "-110%";
    expandgrid.style.left = "0";
}
function closeExpandModal(el) {
    console.log("closing");
    var grid = el;
    var expandgrid = grid.parentElement.children[2];
    grid.style.left = "0";
    expandgrid.style.left = "100%";
}
function closeScreen(el,bool) {
    el.parentElement.style.opacity = "0";
    el.parentElement.parentElement.classList.add('closed');
    if (document.getElementById('screen_start').classList.contains('closed') &&
        document.getElementById('select_games').classList.contains('closed') &&
        document.getElementById('select_cemu').classList.contains('closed') &&
       !bool) {
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

function closeDropdown() {
    var dropdowns = document.getElementsByClassName('visible');
    for (var i = 0; i < dropdowns.length; i++) {
        var icon = dropdowns.item(i).parentElement.getElementsByClassName('fa').item(0).classList;
        dropdowns.item(i).classList.remove('visible');
        icon.remove('fa-caret-up');
        icon.add('fa-caret-down');
    }
}
*/
/*
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
*/








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