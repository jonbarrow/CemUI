const {ipcRenderer} = require('electron'); // Gets ipcRenderer

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


/****************************************************/
/*                    Loads Data                    */
/****************************************************/


ipcRenderer.on('games_emulators_loaded', function(event, data) {
	var games = data["game_list"],
		emulators_list = data["emulators_list"];
	for (var g = games.length - 1; g >= 0; g--) {
		var element = '<div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 flex-center game-loaded-info" game-path="'+games[g]["path"]+'" game-art-background="'+games[g]["background"]+'" game-art-box="'+games[g]["image"]+'" game-data-platform="'+games[g]["platform"]+'" game-data-releaseDate="'+games[g]["releaseDate"]+'" game-data-overview="'+games[g]["overview"]+'" game-data-ESRB="'+games[g]["ESRB"]+'" game-data-players="'+games[g]["players"]+'" game-data-coop="'+games[g]["coop"]+'" game-data-publisher="'+games[g]["publisher"]+'" game-data-developer="'+games[g]["developer"]+'" game-data-rating="'+games[g]["rating"]+'" game-data-title="'+games[g]["title"]+'"> \
                    <div class="card card-inverse">\
                        <img src="'+games[g]["image"]+'" class="card-img-top game-cover" alt="wiiu_game_thumb">\
                        <div class="card-img-overlay">\
                            <h5 class="card-title">'+games[g]["title"]+'</h5>\
                            <!--div game-path="'+games[g]["path"]+'" class="btn-group dropup game-launch-options">\
                                <button launch-with="cemu" type="button" class="btn btn-success launch">Launch</button>\
                                <button type="button" class="btn btn-success dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                                    <span class="sr-only">Launch With</span>\
                                </button>\
                                <div game-path="'+games[g]["path"]+'" class="dropdown-menu">\
                                    <a class="dropdown-item">Launch With</a>\
                                    <div class="dropdown-divider"></div>\
                                    '+emulators_list+'\
                                </div>\
                            </div-->\
                        </div>\
                    </div>\
                </div>';
	    $("#game-holder").append(element);
	}
});

$("body").on("click", ".launch", function(){
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
    $("#details-rating").html($(this).attr('game-data-rating'));
    $("#details-overview").html($(this).attr('game-data-overview'));

    $("#btn-launch").attr('game-path', $(this).attr('game-path'));

    $('#details-overview').css('font-size', '1em');
    
    while($('#details-overview').height() > $('#overview-wrapper').height()) {
        $('#details-overview').css('font-size', (parseInt($('#details-overview').css('font-size')) - 1) + "px" );
    }

    $(".game-loaded-info.hide").fadeOut(200);
});

$(function() {
	$('.loader-container').hide();
})

/****************************************************/
/*                    Dark Theme                    */
/****************************************************/

var isDark = true;

$("#dark-theme-option").click(function() {
    $(".dark-themeable").toggleClass("dark");
    isDark = !isDark;

    if (isDark) {
        $(".dark-themeable").css("color", "white");
    } else {
        $(".dark-themeable").css("color", "black");
    }
});

