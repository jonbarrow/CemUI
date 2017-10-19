const {ipcRenderer} = require('electron');
var progress_balls_ind = 0;

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

ipcRenderer.on('smm_courses_list', (event, data) => {
    let i = 0,
        course_cols = document.querySelectorAll('.colm');
    
    course_cols[0].innerHTML = course_cols[1].innerHTML = '';
    
    for (var level of data) {
        i++;
        let level_wrapper = document.getElementById("TEMPLATE_SMMDB_COURSE").content.firstElementChild.cloneNode(true);
        
        switch (level.difficulty) {
            case 3:
                level_wrapper.querySelectorAll('.title')[0].classList.add('super-expert');
                level_wrapper.querySelectorAll('.title p')[0].innerHTML = 'Super Expert';
                break;
            case 2:
                level_wrapper.querySelectorAll('.title')[0].classList.add('expert');
                level_wrapper.querySelectorAll('.title p')[0].innerHTML = 'Expert';
                break;
            case 1:
                level_wrapper.querySelectorAll('.title')[0].classList.add('normal');
                level_wrapper.querySelectorAll('.title p')[0].innerHTML = 'Normal';
                break;
            case 0:
            default:
                level_wrapper.querySelectorAll('.title')[0].classList.add('easy');
                level_wrapper.querySelectorAll('.title p')[0].innerHTML = 'Easy';
                break;
        }

        switch (level.gameStyle) {
            case 3:
                level_wrapper.querySelectorAll('.type')[0].classList.add('type-3');
                break;
            case 2:
                level_wrapper.querySelectorAll('.type')[0].classList.add('type-2');
                break;
            case 1:
                level_wrapper.querySelectorAll('.type')[0].classList.add('type-1');
                break;
            case 0:
            default:
                level_wrapper.querySelectorAll('.type')[0].classList.add('type-0');
                break;
        }

        addEvent(level_wrapper.querySelectorAll('h1.download')[0], 'click', () => {
            ipcRenderer.send('smm_dl_level', level_wrapper.querySelectorAll('h1.download')[0].getAttribute('data-smm-course-id'));
        });
        level_wrapper.querySelectorAll('h1.download')[0].setAttribute('data-smm-course-id', level.id)
        level_wrapper.querySelectorAll('.course-name')[0].innerHTML = level.title;
        level_wrapper.querySelectorAll('.owner')[0].innerHTML = level.maker;
        level_wrapper.querySelectorAll('.course-star-count')[0].innerHTML = level.stars;
        level_wrapper.querySelectorAll('.img_preview img')[0].src = 'http://smmdb.ddns.net/courseimg/' + level.id + '_full';
        level_wrapper.querySelectorAll('.img_thumbnail img')[0].src = 'http://smmdb.ddns.net/courseimg/' + level.id;
        level_wrapper.querySelectorAll('.upload-date')[0].innerHTML = getFormattedDate(new Date(level.uploaded * 1000));

        if (i % 2 != 0) {
            course_cols[0].appendChild(level_wrapper)
        } else {
            course_cols[1].appendChild(level_wrapper)
        }
    }
});

ipcRenderer.on('ticket_cache_downloaded', () => {
    document.querySelectorAll('#dl .loading-overlay')[0].classList.add('hidden');
    document.querySelectorAll('#dl .main')[0].classList.remove('hidden');
});

ipcRenderer.on('cached_game', (event, data) => {
    const tid = data.titleID.insert(8, "-");
    let bg_test = new Image(),
        src = 'http://cemui.com/api/v2/image/boxart/' + tid;
    
    let item = document.getElementById("TEMPLATE_DL_GRID").content.firstElementChild.cloneNode(true);

    addEvent(item.querySelectorAll('p.download')[0], 'click', () => {
        ipcRenderer.send('dl_game', {tid: tid})
    });
    bg_test.onerror = function () {
        item.querySelector('img').src = "../../defaults/box.jpg";
        item.querySelector('.title').innerHTML = tid + " | " + data.name;
    };

    bg_test.src = src;
    
    item.querySelector('img').src = src;
    item.querySelector('.title').innerHTML = data.name;

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

addEvent(document.querySelectorAll('.input-text-smm')[0], 'keyup', () => {
    ipcRenderer.send('smm_search_courses', {title: document.querySelectorAll('.input-text-smm')[0].value});
});

function toggleSMMDB() {
    var el = document.getElementById('smm');
    if (el.style.display == "block") {
        el.style.top = '-100%';
        setTimeout(function () {
            var el = document.getElementById('smm');
            el.style.display = 'none';
            el.style.top = '0';
            el.querySelector('.main').style.display = 'none';
            el.querySelector('.overlay > div:first-child').style.right = '100%';
            el.querySelector('.overlay > div:nth-child(2)').style.left = '100%';
            el.querySelector('.overlay > div:first-child').style.top = '0%';
            el.querySelector('.overlay > div:nth-child(2)').style.bottom = '0%';
        },500);
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
        el.style.top = '-100%';
        setTimeout(function () {
            var el = document.getElementById('dl');
            el.style.display = 'none';
        },500);
        return;
    }
    
    el.style.display = 'flex';
    el.getElementsByClassName('main')[0].innerHTML = '';
    setTimeout(function () {
        ipcRenderer.send('init', {
            page: '_dlgames'
        });
        el.style.top = '0%';
    },0);
}
            
addEvent(window, 'keypress', function(event) {
    if (event.charCode == 112) {
        ipcRenderer.send('open_dev');
    }
});
function setTheme(event,data) {
    openLoadingScreen();
    setTimeout(function () {
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
    },1000);
}
ipcRenderer.on('theme_change',setTheme);

String.prototype.insert = function(index, string) {
    if (index > 0) {
        return this.substring(0, index) + string + this.substring(index, this.length);
    } else {
        return string + this;
    }
};

function formatDate(input) {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    var d = new Date(input);
    return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('/');
}

function getFormattedDate(date) {
    var year = date.getFullYear();
    /// Add 1 because JavaScript months start at 0
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return month + '/' + day + '/' + year;
}

function openNav() {
    document.getElementById("mySidenav").style.width = "500px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
} 

//update functionality

ipcRenderer.on('update_status',function(e,data) {

    switch (data.type) {
        case 'available':
            openUpdate();
            break;
        case 'progress':
            document.getElementById('update-txt').innerHTML = "Update in progress";
            document.getElementById('update-caption').innerHTML = "Downloading";
            document.getElementById('update-bar').style.width = data.progress.percent + '%';
            console.log(data.progress);
            break;
        case 'completed':
            document.getElementById('update-txt').innerHTML = "Almost finished";
            document.getElementById('update-caption').innerHTML = "Applying update";
            ipcRenderer.send('apply_update');
            break;
        case 'notification_clicked_start':
            openUpdate();
            startUpdate();
            break;
    
        default:
            break;
    }
});

function openUpdate() {
    document.getElementById('update_screen').classList.remove('closed');
    document.getElementById('update-progress').classList.add('closed');
    document.getElementById('update-txt').innerHTML = "Update available";
    document.getElementById('update-caption').innerHTML = "There is an update available, would you like to update?";
    document.getElementById('update-bar').style.width = '0%';
}
function startUpdate() {
    document.getElementById('update-buttons').classList.add('closed');
    document.getElementById('update-progress').classList.remove('closed');
    ipcRenderer.send('download_update');
}
function closeUpdate() {
    document.getElementById('update_screen').children[0].style.left = "-100%";
    setTimeout(function() {
        document.getElementById('update_screen').classList.add('closed');
        document.getElementById('update_screen').children[0].style.left = "0%";
    },1000);
}

//screen functionality
addEvent(document.getElementById('select_cemu').getElementsByClassName('txt-button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    ipcRenderer.send('load_cemu_folder');
    this.classList.add('disabled');
});

addEvent(document.getElementById('select_games').getElementsByClassName('txt-button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    ipcRenderer.send('load_games_folder');
    this.classList.add('disabled');
});

ipcRenderer.on('show_screen', function(event, data) {
    console.log('set loading');
    if (!data) {
        startLoading();
    } else {
        var balls = document.getElementById('progress_balls');
        if (data.cemu) {
            openScreen('select_cemu');
            balls.innerHTML += '<div class="ball"></div>';
        }
        if (data.games) {
            openScreen('select_games');
            balls.innerHTML += '<div class="ball"></div>';
        }
        if (data.welcome){
            openScreen('screen_start');
            balls.innerHTML += '<div class="ball"></div>';
        }
        balls.children[progress_balls_ind].classList.add('selected');
    }   
});

ipcRenderer.on('cemu_folder_loaded', function(event, data) {
    setTimeout(function () {
        closeScreen('select_cemu');
    },0);
});

ipcRenderer.on('games_folder_loaded', function(event, data) {
    closeScreen('select_games');
});

ipcRenderer.on('game_folder_loading', function(event, data) {
    console.log('loading, this may take a while');
});

function openScreen(id) {
    var el = document.getElementById(id);
    el.classList.remove('closed');
}
function closeScreen(id) {
    progress_balls_ind++;
    var el = document.getElementById(id);
    var balls = document.getElementById('progress_balls');
    el.style.left = '-100%';
    setTimeout(function () {
        var el = document.getElementById(id);
        el.classList.add('closed');
    },1000);
    balls.querySelector('.selected').classList.remove('selected');
    if (!balls.children[progress_balls_ind]) {
        balls.innerHTML = "";
        setTimeout(function () {
            var screens = document.getElementById('screens');
            screens.style.display = 'none';
        },1000);
        startLoading();
    } else {
        balls.children[progress_balls_ind].classList.add('selected');
    }
}
function startLoading() {
    ipcRenderer.send('ask_for_theme');
}
function openLoadingScreen() {
    document.getElementById('loading_screen').style.left = "0%";
    document.getElementById('loading_screen').parentElement.style.display = 'block';
}
ipcRenderer.on('wrapper_close_loading',function () {
    console.log('wrapper_close_loading')
    document.getElementById('loading_screen').style.left = "-100%";
});

//get screen info
ipcRenderer.send('init',{page: 'wrapper'});