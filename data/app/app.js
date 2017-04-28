const {ipcRenderer} = require('electron'); // Gets ipcRenderer

var isDarkTheme = false;

$(function() {
    $('.loader-container').hide();
    $('[data-toggle="popover"]').popover();
})

/****************************************************/
/*                      Events                      */
/****************************************************/

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
            $("#game-holder").css('display', 'flex');
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
            $(".display-text-rows").css('display', 'block');
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

$("#box-display-option").click(function() {
    loadGameDisplay('box');
});
$("#list-display-option").click(function() {
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