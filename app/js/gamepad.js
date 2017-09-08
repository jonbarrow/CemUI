var sound_switch = new Audio('sounds/pop_drip.wav'),
    sound_switch_error = new Audio('sounds/digi_chirp.wav');


Controller.search({
    settings: {
        useAnalogAsDpad: "both"
    }
});

window.addEventListener('gc.controller.found', function(event) {
    var games = document.getElementById('games-grid').getElementsByClassName('grid-item'),
        highlighted = document.getElementsByClassName('highlight');

    if (!games[0]) return;

    if (highlighted) {
        highlighted[0].classList.add('controller-active');
    } else {
        games[0].classList.add('controller-active');
    }
    
}, false);

window.addEventListener('gc.button.press', function(event) {
	switch (event.detail.name) {
        case 'FACE_1':
            var current_selected = document.getElementsByClassName('controller-active grid-item')[0];
            if (!current_selected) return;
            if (modal_open) {
                var modal = document.getElementsByClassName('selected-modal')[0],
                    buttons_list = modal.getElementsByClassName('buttons')[0],
                    current_selected = buttons_list.getElementsByClassName('controller-active')[0];

                if (current_selected) {
                    current_selected.click();
                }
                
                return;
            }
            openModal(current_selected.getAttribute('data-modal-id'));
            break;
        case 'FACE_2':
            var selected_buttons = document.getElementsByClassName('button controller-active');
            if (selected_buttons.length > 0) {
                for (var i=0;i<selected_buttons.length;i++) {
                    selected_buttons[i].classList.remove('controller-active');
                }
            }
            closeModal();
            break;
        case 'DPAD_RIGHT':
        case 'RIGHT_SHOULDER':
        case 'RIGHT_SHOULDER_BOTTOM':
            sound_switch.pause();
            sound_switch.currentTime = 0.0;
            sound_switch_error.pause();
            sound_switch_error.currentTime = 0.0;

            if (modal_open) {
                var modal = document.getElementsByClassName('selected-modal')[0],
                    buttons_list = modal.getElementsByClassName('buttons')[0],
                    current_selected = buttons_list.getElementsByClassName('controller-active'),
                    carry = current_selected[0];
                    
                if (!carry) {
                    buttons_list.firstElementChild.classList.add('controller-active');
                } else if (carry.nextElementSibling) {
                    for (var i=current_selected.length-1;i>=0;i--) {
                        current_selected[i].classList.remove('controller-active');
                    }
                    carry.nextElementSibling.classList.add('controller-active');
                }
                return;
            }

            var current_selected = document.getElementsByClassName('controller-active grid-item'),
                carry = current_selected[0];
            
            var pos = carry.getBoundingClientRect(),
                next = document.elementFromPoint(pos.left + carry.clientWidth + 20, carry.scrollTop + pos.top + 20);


            /* // Testing positons
            var tst = document.createElement('div');
            tst.style.position = 'absolute';
            tst.style.backgroundColor = 'red';
            tst.style.width = tst.style.height = carry.clientWidth/2 + 20 + 'px';
            tst.style.top = pos.top + 20 + 'px';
            tst.style.left = pos.left + carry.clientWidth + 20 + 'px';
            document.body.appendChild(tst);*/


            if (!next) {
                sound_switch_error.play();
                return;
            }
            if (next.classList == 'boxart') {
                next = next.parentElement;
            }
            if (!next.classList.contains('grid-item')) {
                sound_switch_error.play();
                return;
            }

            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            next.classList.add('controller-active');
            sound_switch.play();
            break;

        case 'DPAD_LEFT':
        case 'LEFT_SHOULDER':
        case 'LEFT_SHOULDER_BOTTOM':
            sound_switch.pause();
            sound_switch.currentTime = 0.0;
            sound_switch_error.pause();
            sound_switch_error.currentTime = 0.0;

            if (modal_open) {
                var modal = document.getElementsByClassName('selected-modal')[0],
                    buttons_list = modal.getElementsByClassName('buttons')[0],
                    current_selected = buttons_list.getElementsByClassName('controller-active'),
                    carry = current_selected[0];
                    
                if (!carry) {
                    buttons_list.firstElementChild.classList.add('controller-active');
                } else if (carry.previousElementSibling) {
                    for (var i=current_selected.length-1;i>=0;i--) {
                        current_selected[i].classList.remove('controller-active');
                    }
                    carry.previousElementSibling.classList.add('controller-active');
                }
                return;
            }

            var current_selected = document.getElementsByClassName('controller-active grid-item'),
                carry = current_selected[0];
            
            var pos = carry.getBoundingClientRect(),
                next = document.elementFromPoint(pos.left - carry.clientWidth/2, carry.scrollTop + pos.top + 20);


            // Testing positons
            /*var tst = document.createElement('div');
            tst.style.position = 'absolute';
            tst.style.backgroundColor = 'red';
            tst.style.width = tst.style.height = carry.clientWidth/2 + 20 + 'px';
            tst.style.top = pos.top + 20 + 'px';
            tst.style.left = pos.left - carry.clientWidth/2 + 'px';
            document.body.appendChild(tst);*/



            if (!next) {
                sound_switch_error.play();
                return;
            }
            if (next.classList == 'boxart') {
                next = next.parentElement;
            }
            if (!next.classList.contains('grid-item')) {
                sound_switch_error.play();
                return;
            }

            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            next.classList.add('controller-active');
            sound_switch.play();
            break;
        case 'DPAD_DOWN':
            if (modal_open) return;
            sound_switch.pause();
            sound_switch.currentTime = 0.0;
            sound_switch_error.pause();
            sound_switch_error.currentTime = 0.0;

            // NEEDS WORK
            var current_selected = document.getElementsByClassName('controller-active grid-item'),
                carry = current_selected[0];
            
            var pos = carry.getBoundingClientRect(),
                next = document.elementFromPoint(pos.left + 20, carry.scrollTop + pos.top + carry.clientHeight + 20);


            /* // Testing positons
            var tst = document.createElement('div');
            tst.style.position = 'absolute';
            tst.style.backgroundColor = 'red';
            tst.style.width = tst.style.height = carry.clientWidth/2 + 20 + 'px';
            tst.style.top = pos.top + carry.clientHeight + 20 + 'px';
            tst.style.left = pos.left + 20 + 'px';
            document.body.appendChild(tst);*/



            if (!next) {
                sound_switch_error.play();
                return;
            }
            if (next.classList == 'boxart') {
                next = next.parentElement;
            }
            if (!next.classList.contains('grid-item')) {
                sound_switch_error.play();
                return;
            }

            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            
            next.classList.add('controller-active');
            sound_switch.play();
            next.scrollIntoView(true);
            games_lib.scrollTop -= games_lib.clientHeight/8;
            break;
        case 'DPAD_UP':
            if (modal_open) return;
            sound_switch.pause();
            sound_switch.currentTime = 0.0;
            sound_switch_error.pause();
            sound_switch_error.currentTime = 0.0;

            // NEEDS WORK
            var current_selected = document.getElementsByClassName('controller-active grid-item'),
                carry = current_selected[0];
    
            var pos = carry.getBoundingClientRect();
                next = document.elementFromPoint(pos.left + 20, pos.top - carry.clientHeight + 20);
            

            /* // Testing positons
            var tst = document.createElement('div');
            tst.style.position = 'absolute';
            tst.style.backgroundColor = 'red';
            tst.style.width = tst.style.height = carry.clientWidth/2 + 20 + 'px';
            tst.style.top = pos.top - carry.clientHeight + 20 + 'px';
            tst.style.left = pos.left + 20 + 'px';
            document.body.appendChild(tst);
            */
            

            if (!next) {
                sound_switch_error.play();
                return;
            }
            if (next.classList == 'boxart') {
                next = next.parentElement;
            }
            if (!next.classList.contains('grid-item')) {
                sound_switch_error.play();
                return;
            }

            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            
            next.classList.add('controller-active');
            sound_switch.play();
            next.scrollIntoView(false);
            games_lib.scrollTop += games_lib.clientHeight/8;
            break;
        default:
            break;
    }
}, false);


Element.prototype.documentOffsetTop = function () {
    return this.offsetTop + ( this.offsetParent ? this.offsetParent.documentOffsetTop() : 0 );
};