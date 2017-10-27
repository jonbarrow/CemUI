var {ipcRenderer} = require('electron'),
    fs = require('fs-extra'),
    path = require('path');

var ipcWrapper = {};
window.alert = function(message, title) {
    console.log(message, title);
}

alert('test', 'title test')

ipcWrapper.ipc = ipcRenderer;
ipcWrapper.listeners = [];
ipcWrapper.on = function(channel, func) {
	this.listeners.push(channel);
	this.ipc.on(channel, func);
}
ipcWrapper.removeListeners = function () {

	for (var i = 0; i < this.listeners.length; i++) {
		ipcRenderer.removeAllListeners(this.listeners[i]);
	}
	this.listeners = [];

}
ipcWrapper.send = function (channel, data) {

	this.ipc.send(channel,data);

}

let LOCAL_RESOURCES_ROOT;
if (fs.pathExistsSync(path.join(__dirname, '../../defaults'))) {
	LOCAL_RESOURCES_ROOT = path.join(__dirname, '../../defaults');
} else {
	LOCAL_RESOURCES_ROOT = path.join(__dirname, '../../../defaults');	
}

var progress_balls_ind = 0,
    downloads_in_progress = {}

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

function insertThemeList(event, data) {
    console.log(data);
    document.getElementById('theme_list').innerHTML = '';
    for (var ind = 0; ind < data.length; ind++) {
        let item = document.getElementById("TEMPLATE_THEME_LIST").content.firstElementChild.cloneNode(true);
        item.querySelector('.bg').style.backgroundImage = 'url("' + data[ind].screenshot + '")';
        item.querySelector('.bg').onclick = function () {
            ipcRenderer.send('change_theme', {
                name: data[ind].name
            });
        }
        //item.querySelector('.desc').style.backgroundColor = data[ind].config.theme_color;
        item.querySelector('.title').innerHTML = /*data[ind].config.title*/ 'placeholder';
        item.querySelector('.description').innerHTML = /*data[ind].config.description*/ 'placeholder';
        document.getElementById('theme_list').appendChild(item);
    }
}

addEvent(document.querySelectorAll('.input-text-smm')[0], 'keyup', () => {
    ipcRenderer.send('smm_search_courses', {title: document.querySelectorAll('.input-text-smm')[0].value});
});

addEvent(document.querySelectorAll('.input-text-game-dl')[0], 'keyup', (event) => {
    ipcRenderer.send('games_search_cache', document.querySelectorAll('.input-text-game-dl')[0].value.trim());
});

addEvent(document.querySelector('#popup1 .button'), 'click', (event) => {
    ipcRenderer.send('rom_decryption_missing');
    document.querySelector('#popup1').classList.add('hidden');
});

addEvent(document.querySelector('#setting_cdecrypt_location_button'), 'click', () => {
    ipcRenderer.send('rom_decryption_missing');
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

function toggleSMMDBPlayerCourses() {
    var el = document.getElementById('smm-wrapper-player-courses');
    if (el.classList.contains('hidden')) {
        ipcRenderer.send('smm_load_client_courses');
        document.getElementById('smm-wrapper').classList.add('hidden');
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        document.getElementById('smm-wrapper').classList.remove('hidden');
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
        closeMenu();
        let current_view = document.getElementById('webview');
        var new_view = document.createElement('iframe');
        
        current_view.src = '';
        document.body.removeChild(current_view);
        
        ipcWrapper.removeListeners();
        
        new_view.setAttribute('id','webview');
        new_view.setAttribute('src', data.path);
        document.body.appendChild(new_view);
        addEvent(new_view.contentWindow, 'keypress', function(event) {
            if (event.charCode == 112) {
                ipcRenderer.send('open_dev');
            }
        });
        new_view.contentWindow.ipcRenderer = ipcWrapper;
    },1000);
}

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
//menu animations

function openMenu() {
    document.getElementById('menu').style.opacity = '0';
    document.querySelector('#menu .container').style.left = '-100%';
    document.getElementById('menu').style.display = 'block';
    setTimeout(function () {
        document.getElementById('menu').style.opacity = '1';
        setTimeout(function () {
            document.querySelector('#menu .container').style.left = '0%';
        },250);
    },10);
}
function closeMenu() {
    document.querySelector('#menu .container').style.left = '-100%';
    setTimeout(function () {
        document.getElementById('menu').style.opacity = '0';
        setTimeout(function () {
            document.getElementById('menu').style.display = 'none';
            closeMenuSection('theme_selection');
            closeMenuSection('settings_section');
        },250);
    },250);
}
function openMenuSection(id) {
    document.getElementById(id).style.left = '0%';
}
function closeMenuSection(id) {
    document.getElementById(id).style.left = '-100%';
}
//menu onclicks
document.getElementById('dlgames_button').onclick = function () {
    toggleGAMES();
    closeMenu();
}
document.getElementById('smmdb_button').onclick = function () {
    toggleSMMDB();
    closeMenu();
}
document.getElementById('themes_button').onclick = function () {
    openMenuSection('theme_selection');
}
document.getElementById('settings_button').onclick = function () {
    openMenuSection('settings_section');
}

//update functionality

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
addEvent(document.querySelector('.cemu_skip'), 'click', function() {
    ipcRenderer.send('skip_cemu_folder');
});

addEvent(document.getElementById('select_games').getElementsByClassName('txt-button')[0], 'click', function() {
    if (this.classList.contains('disabled')) {
        return false;
    }
    ipcRenderer.send('load_games_folder');
    this.classList.add('disabled');
});
addEvent(document.querySelector('.games_skip'), 'click', function() {
    ipcRenderer.send('skip_games_folder');
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

//get screen info

function setIPCevents() {
    
    ipcRenderer.on('wrapper_close_loading',function () {
        console.log('wrapper_close_loading')
        document.getElementById('loading_screen').style.left = "-100%";
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
    
    ipcRenderer.on('open_menu_wrapper', function(event, data) {
        openMenu();
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

    ipcRenderer.on('ticket_cache_downloaded', (event, data) => {
        document.querySelectorAll('#dl .loading-overlay')[0].classList.add('hidden');
        document.querySelectorAll('#dl .main')[0].classList.remove('hidden');
    });

    ipcRenderer.on('ticket_downloaded', (event, data) => {
        document.querySelector('#dl .loading-overlay .title .small small').innerHTML = 'This may take a while <b>' + data.id + '/' + data.total + '</b>'
    });

    ipcRenderer.on('ticket_cache_search_results', (event, data) => {
        document.querySelectorAll('#dl .main')[0].innerHTML = '';
        for (let title of data) {
            const tid = title.titleID.insert(8, "-").toUpperCase();
            let bg_test = new Image(),
                src = 'http://cemui.com/api/v2/image/boxart/' + tid;
    
            let item = document.getElementById("TEMPLATE_DL_GRID").content.firstElementChild.cloneNode(true);
    
            item.setAttribute('data-dl-grid', tid);

            addEvent(item.querySelectorAll('p.download')[0], 'click', () => {
                if (item.querySelectorAll('p.download')[0].classList.contains('disabled')) {
                    return;
                }
                let options = {
                    tid: tid,
                    title: title.name.replace(/[^\w\s]/gi, '').replace(/\n/g, ' ').replace(/\r/g, ' '),
                    region: title.region
                }

                if (item.querySelector('input[name="dlc-boolean"]').checked) {
                    options.dl_dlc = true;
                }

                if (item.querySelector('.update-selector').value.trim() != '') {
                    options.dl_update = item.querySelector('.update-selector').value.trim();
                }

                ipcRenderer.send('dl_game', options);
            });
            bg_test.onerror = function () {
                item.querySelector('img').src = LOCAL_RESOURCES_ROOT + "/box.jpg";
            };
    
            bg_test.src = src;
    
            item.querySelector('.overlayL').innerHTML = title.region;
            item.querySelector('img').src = src;
            item.querySelector('.title').innerHTML = title.name;

            if (!title.dlc || title.dlc.length < 1) {
                item.querySelector('.overlayR').classList.add('hidden');
            } else {
                item.querySelector('.dlc-boolean').classList.remove('hidden');
            }

            if (title.updates && title.updates.length >= 1) {
                item.querySelector('.update-selector').classList.remove('hidden');
                for (let update of title.updates) {
                    let option = document.createElement('option');
                    option.value = option.innerHTML = update;
                    item.querySelector('.update-selector').appendChild(option);
                }
            }

            document.querySelectorAll('#dl .main')[0].appendChild(item)
        }
    });
    
    ipcRenderer.on('theme_change',setTheme);

    ipcRenderer.on('game_dl_started', (event, data) => {

        let item = document.getElementById("TEMPLATE_DL_LIST").content.firstElementChild.cloneNode(true);
        
        addEvent(item.querySelector('p.cancel'), 'click', () => {
            document.querySelector('div[data-dl-grid="' + data.tid + '"]').querySelector('p.download').classList.remove('disabled');
            item.parentElement.removeChild(item);
            ipcRenderer.send('cancel_game', data.tid);
        });

        item.setAttribute('data-dl-location', data.location);

        item.querySelector('h2.title').innerHTML = data.title + ' (' + data.region + ')';
        item.id = 'dl-list-entry-' + data.tid.toLowerCase();

        document.querySelector('#download_list').appendChild(item);
        openNav();
    });

    ipcRenderer.on('download_total_size', (event, data) => {
        downloads_in_progress[data.tid] = {
            total_size: data.size,
            current_size: 0
        }
    });

    ipcRenderer.on('download_status', (event, data) => {
        console.log(data)
        let item = document.querySelector('#dl-list-entry-' + data.tid.toLowerCase().insert(8, '-'));
        if (!item) return;

        downloads_in_progress[data.tid].current_size += data.received_bytes_raw;

        let total_size = downloads_in_progress[data.tid].total_size,
            current_size = downloads_in_progress[data.tid].current_size;

        //item.querySelector('.title').innerHTML = total_size + '/' + data.received_bytes_raw;
        item.querySelector('.download_ind').style.width = ((current_size / total_size) * 100) + '%';
        item.querySelector('.status').innerHTML = 'Downloading... ' + Math.round((current_size / total_size) * 100) + '%';
    });

    ipcRenderer.on('rom_decryption_started', (event, data) => {
        let item = document.querySelector('div[data-dl-location="' + data.replace(/\\/g, '\\\\') + '"]');
        item.querySelector('div').removeChild(item.querySelector('p.cancel'));
        item.querySelector('.status').innerHTML = 'Decrypting...';
    });

    ipcRenderer.on('rom_decryption_completed', (event, data) => {
        let item = document.querySelector('div[data-dl-location="' + data.replace(/\\/g, '\\\\') + '"]');
        item.querySelector('.status').innerHTML = 'Finished';
    });

    ipcRenderer.on('smm_show_loader', () => {
        document.querySelector('#situp-loading-overlay').classList.remove('hidden');
    });

    ipcRenderer.on('smm_player_courses', (event, data) => {
        document.querySelector('#situp-loading-overlay').classList.add('hidden');
        let i = 0,
            course_cols = document.querySelectorAll('.colm');

        course_cols[2].innerHTML = course_cols[3].innerHTML = '';
        for (let smm_save_dir of data) {
            for (let course_data of smm_save_dir.courses) {
                i++;
                let course = document.getElementById("TEMPLATE_SMMDB_COURSE").content.firstElementChild.cloneNode(true);
                course.querySelector('.details').removeChild(course.querySelector('.stars'));

                addEvent(course.querySelector('h1.download'), 'click', () => {
                    ipcRenderer.send('smm_upload_level', path.join(course_data.cemu, 'mlc01/emulatorSave', course_data.save_id, course_data.course_id));
                });
                addEvent(course.querySelector('.img_thumbnail'), 'click', () => {
                    ipcRenderer.send('smm_change_thumbnail_image', path.join(course_data.cemu, 'mlc01/emulatorSave', course_data.save_id, course_data.course_id));
                });
                addEvent(course.querySelector('.img_preview'), 'click', () => {
                    ipcRenderer.send('smm_change_preview_image', path.join(course_data.cemu, 'mlc01/emulatorSave', course_data.save_id, course_data.course_id));
                });

                let imgs = course.querySelectorAll('.img_container');
                for (let img of imgs) {
                    let div = document.createElement('div');
                    div.classList = 'txt-s-16 txt-c-white'
                    div.innerHTML = '<p>Change Image</p>';
                    img.appendChild(div);
                }
                
                course.querySelector('h1.download').innerHTML = 'Upload';
                course.querySelector('h1.download').classList.add('upload');
                course.querySelector('h1.download').classList.remove('download');
                course.querySelector('.course-name').innerHTML = course_data.title;
                course.querySelector('.owner').innerHTML = course_data.maker;
                course.querySelector('.img_preview img').src = path.join(course_data.cemu, 'mlc01/emulatorSave', course_data.save_id, 'course' + course_data.id, 'thumbnail0.jpg?' + new Date());
                course.querySelector('.img_thumbnail img').src = path.join(course_data.cemu, 'mlc01/emulatorSave', course_data.save_id, 'course' + course_data.id, 'thumbnail1.jpg?' + new Date());

                if (i % 2 != 0) {
                    course_cols[2].appendChild(course)
                } else {
                    course_cols[3].appendChild(course)
                }
            }
        }
    });

    ipcRenderer.on('rom_decryption_missing', () => {
        document.querySelector('#popup1').classList.remove('hidden');
    });
    
    ipcRenderer.on('themes_list',insertThemeList);
}

setIPCevents();
ipcRenderer.send('init',{page: 'wrapper'});

String.prototype.insert = function(index, string) {
    if (index > 0) {
        return this.substring(0, index) + string + this.substring(index, this.length);
    } else {
        return string + this;
    }
};
