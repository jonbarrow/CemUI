const {ipcRenderer} = require('electron'); // Gets ipcRenderer

/****************************************************/
/*                      Events                      */
/****************************************************/

$("#load_games_option").click(function(event) {
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


/****************************************************/
/*                    Loads Data                    */
/****************************************************/


$.getJSON("../cache/games.json", function(games) {
	$.getJSON("../cache/emulators.json", function(emulators) {
		var emulators_list = "";
		$.each(emulators, function(e, val) {
			emulators_list += '<a class="dropdown-item launch" launch-with="'+e+'" href="#">'+e+'</a>\n';
		});
		$.each(games, function(g, val) {
		  	var element = '<div class="col-lg-3 col-md-4 col-sm-6 col-xs-12 flex-center game-loaded-info"> \
	                    <div class="card card-inverse">\
	                        <img src="'+games[g]["image"]+'" class="card-img-top game-cover" alt="wiiu_mariokart8_thumb">\
	                        <div class="card-img-overlay">\
	                            <h5 class="card-title">'+games[g]["title"]+'</h5>\
	                            <div game-path="'+games[g]["path"]+'" class="btn-group dropup game-launch-options">\
	                                <button launch-with="cemu" type="button" class="btn btn-success launch">Launch</button>\
	                                <button type="button" class="btn btn-success dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
	                                    <span class="sr-only">Launch With</span>\
	                                </button>\
	                                <div game-path="'+games[g]["path"]+'" class="dropdown-menu">\
	                                    <a class="dropdown-item">Launch With</a>\
	                                    <div class="dropdown-divider"></div>\
	                                    '+emulators_list+'\
	                                </div>\
	                            </div>\
	                        </div>\
	                    </div>\
	                </div>';
		    $("#game-holder").append(element);
		});
	});
});

$("body").on("click", ".launch", function(){
    ipcRenderer.send('launch_game_rom', {emulator:$(this).attr('launch-with'), rom:$(this).parent().attr('game-path')});
});

$(function() {
	$('.loader-container').hide();
})