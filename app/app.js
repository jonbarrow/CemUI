const {ipcRenderer} = require('electron'); // Gets ipcRenderer

var isDarkTheme = false;
var isSMM = false;

$(function() {
    $('.loader-container').hide();
    $('[data-toggle="popover"]').popover();
})

/****************************************************/
/*                      Events                      */
/****************************************************/


ipcRenderer.on('update_available', function(event, data) {
    Notify.Settings = {
        sounds: {
            warning: 'assets/sounds/notify/success-warning/5.mp3',
        },
    };
    Notify.Warning('An update for CemUI has been found. <button class="notify-btn" onclick="startUpdate(\''+data.version+'\')">Download</button>', 86400000);
});
ipcRenderer.on('new_games', function(event, data) {
    Notify.Settings = {
        sounds: {
            warning: 'assets/sounds/notify/success-warning/2.mp3',
        },
    };
    Notify.Warning(data.number+' New games have been found. <button class="notify-btn" onclick="alert(\'Test\')">Download</button>', 86400000);
});


$("#load_games_option").click(function(event) {
    if ($(this).hasClass('disabled')) {
        return false;
    }
	ipcRenderer.send('load_game_folder');
});
$("#load_cemu_option").click(function(event) {
    ipcRenderer.send('load_cemu_folder');
});
$("#folder-select-cemu").click(function(event) {
    ipcRenderer.send('change_folder', 'cemu');
});
$("#folder-select-game").click(function(event) {
    $('html').html(''); // This fixes some weird Chrome rendering bug? Idk why, but fuck it. It works.
    ipcRenderer.send('change_folder', 'game');
});

$("#check-for-update").click(function(event) {
    ipcRenderer.send('checkForUpdate');
});



$(".btn-window-option-minimize").click(function(event) {
	ipcRenderer.send('btn-window-option-minimize');
});
$(".btn-window-option-maximize").click(function(event) {
	ipcRenderer.send('btn-window-option-maximize');
});
$(".btn-window-option-close").click(function(event) {
	ipcRenderer.send('btn-window-option-close');
});
ipcRenderer.on('game_folder_loaded', function(event, data) {
	$("html").fadeOut('500', function() {
		ipcRenderer.send('load_window_cemu_load', data);
	});
});
ipcRenderer.on('cemu_folder_loaded', function(event, data) {
    $("html").fadeOut('500', function() {
        ipcRenderer.send('load_main_window', data);
    });
});
ipcRenderer.on('game_folder_loading', function(event, data) {
    $("#load_games_option").addClass('disabled');
    $("h5").html("Downloading Game Data...").append('<br><small class=\"text-muted\">(This may take a moment)</small>');
    $("button").append(' <div class="fa fa-spinner fa-spin"></div>');
});
ipcRenderer.on('dark_theme', function(event, data) {
    $('#dark-theme-toggle').prop("checked", true);
    changeTheme('dark');
});
ipcRenderer.on('update_play_time', function(event, data) {
    $('i.launch').each(function() {
        if ($(this).attr('game-path') == data.game_path) {
            $(this).parent().children('.game-time').html(msToTime(data.new_time)+'<i class="material-icons float-right">alarm</i>');
            return false;
        }
    });
});

ipcRenderer.on('download_update_percent', function(event, data) {
    $("#download-value").html(data['percentage'].toFixed(2)+'%');
    $("#download-progress").css('width', data['percentage']+'%');
    $("#download-progress").attr('aria-valuenow', data['percentage']);
});


/****************************************************/
/*                    Loads Data                    */
/****************************************************/


ipcRenderer.on('games_emulators_loaded', function(event, data) {
    $('#folder-select-cemu-input').val(data['settings']['cemu_folder_path']);
    $('#folder-select-game-input').val(data['settings']['game_folder_path']);
    loadGameDisplay(data['display']);
});

$("body").on("click", ".launch", function(e) {
    if ($(this).hasClass('disabled')) {
        console.log("disabled")
        return false;
    }
    ipcRenderer.send('launch_game_rom', {emulator:$(this).attr('launch-with'), rom:$(this).attr('game-path')});
});

$("#btn-back").click(function(event) {
    if ($(this).hasClass('hide')) {
        return false;
    }

    $('html, body').css({
        overflow: 'auto',
        height: 'auto'
    });

    $(this).addClass('hide');
    $(".game-loaded-info").fadeIn(200);
    $(".bg-image").animate({opacity: 0}, 200, function() {
        $(".content-details").css('display', 'none');
    });
    $(".content-details").animate({opacity: 0}, 200, function() {
        $(".game-loaded-info").removeClass('hide');
    });
});

$("body").on("click", ".game-loaded-info", function() {
    if ($(this).hasClass('hide')) {
        return false;
    }
    if ($(this).hasClass('disabled')) {
        $('#btn-launch').addClass('disabled').addClass('btn-default').removeClass('btn-success');
    } else {
        $('#btn-launch').removeClass('disabled').removeClass('btn-default').addClass('btn-success');
    }
        
    $("#btn-back").removeClass('hide');
    $(".content-details").css('display', 'block');
    $(".game-loaded-info").addClass('hide');
    $(".bg-image").css('display', 'inline').attr('src', $(this).attr('game-art-background')).animate({opacity: 1}, 200);
    $(".content-details").animate({opacity: 1}, 200);
    
    $('html, body').css({
        overflow: 'hidden',
        height: '100%'
    });

    $("#details-title").html($(this).attr('game-data-title'));
    $("#details-releaseDate").html($(this).attr('game-data-releaseDate'));
    $("#details-developer").html($(this).attr('game-data-developer'));
    $("#details-publisher").html($(this).attr('game-data-publisher'));
    $("#details-platform").html($(this).attr('game-data-platform'));
    $("#details-ESRB").html($(this).attr('game-data-ESRB'));
    $("#details-players").html($(this).attr('game-data-players'));
    $("#details-coop").html($(this).attr('game-data-coop'));
    $("#details-overview").html($(this).attr('game-data-overview'));
    $("#game-compatibility").html($(this).attr('game-playability'));

    if ($(this).attr('game-playability').startsWith('Perfect')) {
        $("#game-compatibility").parent().parent().css({
            'background-color': '#1ba1e2',
            'border': '#1ba1e2'
        });
    } else if ($(this).attr('game-playability').startsWith('Playable')) {
        $("#game-compatibility").parent().parent().css({
            'background-color': '#60a917',
            'border': '#60a917'
        });
    } else if ($(this).attr('game-playability').startsWith('Runs')) {
        $("#game-compatibility").parent().parent().css({
            'background-color': '#e3c800',
            'border': '#e3c800'
        });
    } else if ($(this).attr('game-playability').startsWith('Loads')) {
        $("#game-compatibility").parent().parent().css({
            'background-color': '#f0a30a',
            'border': '#f0a30a'
        });
    } else if ($(this).attr('game-playability').startsWith('Unplayable')) {
        $("#game-compatibility").parent().parent().css({
            'background-color': '#e51400',
            'border': '#e51400'
        });
    } else {
        $("#game-compatibility").parent().parent().css({
            'background-color': '#333',
            'border': '#333'
        });
    }

    $("#btn-launch").attr('game-path', $(this).attr('game-path'));


    $(".game-loaded-info.hide").fadeOut(200);
});

/****************************************************/
/*                    Dark Theme                    */
/****************************************************/

function changeTheme(theme) {
    ipcRenderer.send('change_theme', theme);
}
ipcRenderer.on('theme_changed', function(event, theme) {
    switch(theme) {
        case 'dark':
            $(".dark-themeable").addClass('dark');
            $(".dark-themeable").css("color", "white");
            isDarkTheme = true;
            break;
        case 'light':
            $(".dark-themeable").removeClass("dark");
            $(".dark-themeable").css("color", "black");
            isDarkTheme = false;
            break;
    }
});

$("#dark-theme-toggle").click(function() {
    if (this.checked) {
        changeTheme('dark');
    } else {
        changeTheme('light');
    }
});

$("#dark-theme-option").click(function() {
    changeTheme('dark');
});
$("#light-theme-option").click(function() {
    changeTheme('light');
});


function loadGameDisplay(display) {
    ipcRenderer.send('change_display', display);
}

ipcRenderer.on('display_changed', function(event, data) {
    var games = data["game_list"],
        emulators_list = data["emulators_list"],
        display = data['display'];

    $("#game-holder").css('display', 'none').html('');
    $(".display-text-rows").css('display', 'none');
    $(".display-text-rows ul").html('');

    switch(display) {
        case 'box':

            if (!isSMM) {
                $("#game-holder").css('display', 'flex');
            }
            
            for (var g = games.length - 1; g >= 0; g--) {
                var invalid = "";
                if (games[g]["invalid"]) invalid = 'disabled';

                var element = '<div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 flex-center game-loaded-info '+invalid+'" game-playability="'+games[g]["playability"]+'" game-path="'+games[g]["path"]+'" game-art-background="'+games[g]["background"]+'" game-art-box="'+games[g]["image"]+'" game-data-releaseDate="'+games[g]["releaseDate"]+'" game-data-overview="'+games[g]["overview"]+'" game-data-ESRB="'+games[g]["ESRB"]+'" game-data-players="'+games[g]["players"]+'" game-data-coop="'+games[g]["coop"]+'" game-data-publisher="'+games[g]["publisher"]+'" game-data-developer="'+games[g]["developer"]+'" game-data-title="'+games[g]["title"]+'"> \
                            <div class="card card-inverse">\
                                <img src="'+games[g]["image"]+'" class="card-img-top game-cover" alt="wiiu_game_thumb">\
                                <div class="card-img-overlay">\
                                    <h5 class="card-title">'+games[g]["title"]+'</h5>\
                                </div>\
                            </div>\
                        </div>';
                $("#game-holder").append(element);
            }
            break;
        case 'list':

            if (!isSMM) {
                $(".display-text-rows").css('display', 'block');
            }

            for (var g = games.length - 1; g >= 0; g--) {
                var invalid = "";
                if (games[g]["invalid"]) invalid = 'disabled';

                if (games[g]['playability'].startsWith('Perfect')) {
                    var compatibility = 'perfect';
                } else if (games[g]['playability'].startsWith('Playable')) {
                    var compatibility = 'playable';
                } else if (games[g]['playability'].startsWith('Runs')) {
                    var compatibility = 'runs';
                } else if (games[g]['playability'].startsWith('Loads')) {
                    var compatibility = 'loads';
                } else if (games[g]['playability'].startsWith('Unplayable')) {
                    var compatibility = 'unplayable';
                } else {
                    var compatibility = 'default';
                }

                if (isDarkTheme) {
                    var element = '<li class="animated slideInUp dark-themeable dark">\
                        <div class="collapsible-header dark-themeable dark">\
                            <i data-toggle="popover" data-trigger="hover" data-placement="top" data-content="Launch" class="material-icons launch '+invalid+'" launch-with="cemu" game-playability="'+games[g]["playability"]+'" game-path="'+games[g]["path"]+'" game-data-releaseDate="'+games[g]["releaseDate"]+'" game-data-overview="'+games[g]["overview"]+'" game-data-ESRB="'+games[g]["ESRB"]+'" game-data-players="'+games[g]["players"]+'" game-data-coop="'+games[g]["coop"]+'" game-data-publisher="'+games[g]["publisher"]+'" game-data-developer="'+games[g]["developer"]+'" game-data-title="'+games[g]["title"]+'">queue_play_next</i>\
                            <i class="material-icons list-compatibility '+compatibility+'">games</i>\
                            '+games[g]["title"]+'<span class="float-right game-time">'+msToTime(games[g]["play_time"])+'<i class="material-icons float-right">alarm</i></span>\
                            </div>\
                        <div class="collapsible-body dark-themeable dark"><span>'+games[g]["overview"]+'</span></div>\
                    </li>';
                } else {
                    var element = '<li class="animated slideInUp dark-themeable">\
                        <div class="collapsible-header dark-themeable">\
                            <i data-toggle="popover" data-trigger="hover" data-placement="top" data-content="Launch" class="material-icons launch '+invalid+'" '+invalid+' launch-with="cemu" game-playability="'+games[g]["playability"]+'" game-path="'+games[g]["path"]+'" game-data-releaseDate="'+games[g]["releaseDate"]+'" game-data-overview="'+games[g]["overview"]+'" game-data-ESRB="'+games[g]["ESRB"]+'" game-data-players="'+games[g]["players"]+'" game-data-coop="'+games[g]["coop"]+'" game-data-publisher="'+games[g]["publisher"]+'" game-data-developer="'+games[g]["developer"]+'" game-data-title="'+games[g]["title"]+'">queue_play_next</i>\
                            <i class="material-icons list-compatibility '+compatibility+'">games</i>\
                            '+games[g]["title"]+'<span class="float-right game-time">'+msToTime(games[g]["play_time"])+'<i class="material-icons float-right">alarm</i></span></div>\
                        <div class="collapsible-body dark-themeable">\
                            <span class="badge list-compatibility-block '+compatibility+'">'+games[g]["playability"]+'</span><br>\
                            <span>'+games[g]["overview"]+'</span>\
                        </div>\
                    </li>';
                }

                
                $(".display-text-rows ul").append(element);
                $('[data-toggle="popover"]').popover();
            }
            break;
    }
});

ipcRenderer.on('smm_search_results', function(event, data) {
    $('.smm-search-results').html('');
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {

        var id = data[keys[i]].id,
            title = data[keys[i]].title,
            owner_id = data[keys[i]].owner,
            owner_name = data[keys[i]].ownername,
            difficulty = data[keys[i]].difficulty,
            completed = data[keys[i]].completed,
            downloads = data[keys[i]].downloads,
            points = data[keys[i]].points,
            stars = data[keys[i]].stars,
            videoid = false;

        if (data[keys[i]].hasimage) {
            var imagelink = 'http://smmdb.ddns.net/img/courses/thumbnails/'+id+'.pic'
        } else {
            var imagelink = './assets/img/smm/static.gif'
        }
        if (data[keys[i]].videoid) {
            videoid = data[keys[i]].videoid;
        }
        
        var element = '<li class="col-sm-6 col-md-4 col-lg-3 smm-level" smm-level-id="'+id+'" smm-level-title="'+title+'" smm-level-owner-id="'+owner_id+'" smm-level-owner-name="'+owner_name+'" smm-level-difficulty="'+difficulty+'" smm-level-completed="'+completed+'" smm-level-downloads="'+downloads+'" smm-level-points="'+points+'" smm-level-stars="'+stars+'" smm-level-videoid="'+videoid+'">\
                    <div class="card" data-toggle="modal" data-target="#smmLevelModal">\
                        <div class="smm-level-thumb">\
                            <img src="'+imagelink+'" alt="'+data[keys[i]].title+' thumbnail image.">\
                        </div>\
                        <div class="face front">\
                            <div class="card-block smm-level-title">\
                                <p class="card-title"><span>'+data[keys[i]].title+'</span></p>\
                            </div>\
                        </div>\
                    </div>\
                </li>\
        ';
        $('.smm-search-results').append(element);
    }
});

ipcRenderer.on('smm_level_dl_start', function(event, data) {
    $('.smm-level-download-popup').css('display', 'block');
});
ipcRenderer.on('smm_level_progress', function(event, data) {
    $('.smm-level-download-popup').find('h1').html('Downloading Level '+data.progress.toFixed(2)+'%');
});
ipcRenderer.on('smm_level_extract', function(event, data) {
    $('.smm-level-download-popup').find('h1').html('Extracting Level');
});
ipcRenderer.on('smm_level_extract', function(event, data) {
    $('.smm-level-download-popup').css('display', 'none');
});

$("#box-display-option").click(function() {
    
    if (isSMM) {
        return;
    }

    loadGameDisplay('box');
});
$("#list-display-option").click(function() {

    if (isSMM) {
        return;
    }

    $('html, body').css({
        overflow: 'auto',
        height: 'auto'
    });

    $('#btn-back').addClass('hide');
    $(".game-loaded-info").fadeIn(200);
    $(".bg-image").animate({opacity: 0}, 200, function() {
        $(".content-details").css('display', 'none');
    });
    $(".content-details").animate({opacity: 0}, 200, function() {
        loadGameDisplay('list');
    });
});

$('#smm-search-btn').click(function(e) {
    e.preventDefault();
    var title = $('#smm-search-title').val(),
        order = $('#smm-search-order').val(),
        dir = $('#smm-search-dir').val(),
        coursetype = $('#smm-search-coursetype').val(),
        difficultyfrom = $('#smm-search-difficultyfrom').val(),
        difficultyto = $('#smm-search-difficultyto').val(),
        ispackage = 0;

    if ($('#smm-search-ispackage').prop("checked")) {
        ispackage = 1;
    }

    switch(order) {
        case 'Last Modified':
            var order = 'lastmodified';
            break;
        case 'Upload Date':
            var order = 'uploaded';
            break;
        case 'Title':
            var order = 'title';
            break;
        case 'Stars':
            var order = 'stars';
            break;
        case 'Downloads':
            var order = 'downloads';
            break;
        case 'Completions':
            var order = 'completed';
            break;
    }
    switch(dir) {
        case 'Ascending':
            var dir = 'asc';
            break;
        case 'Descending':
            var dir = 'desc';
            break;
    }
    switch(coursetype) {
        case 'Own Creation':
            var coursetype = 0;
            break;
        case 'Recreation':
            var coursetype = 1;
            break;
        case 'WiiU Dump':
            var coursetype = 2;
            break;
    }
    switch(difficultyfrom) {
        case 'Easy':
            var difficultyfrom = 0;
            break;
        case 'Normal':
            var difficultyfrom = 1;
            break;
        case 'Expert':
            var difficultyfrom = 2;
            break;
        case 'Super Expert':
            var difficultyfrom = 3;
            break;
        case 'Mixed':
            var difficultyfrom = 4;
            break;
    }
    switch(difficultyto) {
        case 'Easy':
            var difficultyto = 0;
            break;
        case 'Normal':
            var difficultyto = 1;
            break;
        case 'Expert':
            var difficultyto = 2;
            break;
        case 'Super Expert':
            var difficultyto = 3;
            break;
        case 'Mixed':
            var difficultyto = 4;
            break;
    }

    ipcRenderer.send('smm_search', {title: title, order: order, dir: dir, ispackage: ispackage, coursetype: coursetype, difficultyto: difficultyto, difficultyfrom: difficultyfrom});
});

$('#smm-toggle').click(function(e) {
    e.preventDefault();
    if (!$(this).hasClass('active')) {

        isSMM = true;

        if ($('body').hasClass('dark')) {
            $('body').addClass('dark-tmp');
            $('body').removeClass('dark-themeable');
            $('body').css('color', 'black');
            $('body').removeClass('dark');
        }
        $(".game-loaded-info").css('display', 'none');
        $(".content-details").css('display', 'none');
        $(".bg-image").css('display', 'none');
        $(".content-smm").css('display', 'block');
    } else {

        isSMM = false;

        if ($('body').hasClass('dark-tmp')) {
            $('body').addClass('dark');
            $('body').addClass('dark-themeable');
            $('body').css('color', 'white');
            $('body').removeClass('dark-tmp');
        }
        $(".content-smm").css('display', 'none');
        $(".game-loaded-info").css('display', 'flex');
    }

    $(this).toggleClass('active');
    $('body').toggleClass('smm-active');

});

$('body').on('click', '.smm-level', function(event) {
    event.preventDefault();
    switch($(this).attr('smm-level-difficulty')) {
        case '0':
            var difficulty = 'Easy';
            $("#smm-level-difficulty").parent().parent().css({
                'background-color': '#60a917',
                'border': '#60a917'
            });
            break;
        case '1':
            var difficulty = 'Normal';
            $("#smm-level-difficulty").parent().parent().css({
                'background-color': '#e3c800',
                'border': '#e3c800'
            });
            break;
        case '2':
            var difficulty = 'Expert';
            $("#smm-level-difficulty").parent().parent().css({
                'background-color': '#f0a30a',
                'border': '#f0a30a'
            });
            break;
        case '3':
            var difficulty = 'Super Expert';
            $("#smm-level-difficulty").parent().parent().css({
                'background-color': '#e51400',
                'border': '#e51400'
            });
            break;
        case '4':
            var difficulty = 'Mixed';
            $("#smm-level-difficulty").parent().parent().css({
                'background-color': '#1ba1e2',
                'border': '#1ba1e2'
            });
            break;
    }
    if ($(this).attr('smm-level-videoid') !== 'false') {
       $('.smm-level-data-video').css('display', 'block');
       $('.smm-level-data-video').find('iframe').attr('src', 'https://www.youtube.com/embed/'+$(this).attr('smm-level-videoid'));
    } else {
        $('.smm-level-data-video').css('display', 'none');
    }
    $('#smmLevelModal').find("#smm-level-difficulty").html(difficulty);
    $('#smmLevelModal').find('.modal-title').html($(this).attr('smm-level-title'));
    $('#smmLevelModal').find('.smm-level-data-creator').html($(this).attr('smm-level-owner-name'));

    $('#smmLevelModal').find('#smm-level-data-download').attr('level-id', $(this).attr('smm-level-id'));

    $('#smmLevelModal').find('.smm-level-data-points').html($(this).attr('smm-level-points'));
    $('#smmLevelModal').find('.smm-level-data-stars').html($(this).attr('smm-level-stars'));
    $('#smmLevelModal').find('.smm-level-data-downloads').html($(this).attr('smm-level-downloads'));
    $('#smmLevelModal').find('.smm-level-data-completions').html($(this).attr('smm-level-completed'));
});

$('#smm-level-data-download').click(function(event) {
    ipcRenderer.send('smm_dl_level', $(this).attr('level-id'));
});

function startUpdate(version) {
    ipcRenderer.send('start_update', version);
}

function msToTime(s) {

    function pad(n, z) {
        z = z || 2;
        return ('00' + n).slice(-z);
    }

    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}