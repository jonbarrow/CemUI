var sound_switch = new Audio('sounds/pop_drip.wav'),
    sound_switch_error = new Audio('sounds/digi_chirp.wav');


Controller.search({
    settings: {
        useAnalogAsDpad: "both"
    }
});

window.addEventListener('gc.controller.found', function(event) {
    var games = document.getElementById('games-grid').getElementsByClassName('grid-item');
    if (!games[0]) return;

    games[0].classList.add('controller-active');

}, false);

window.addEventListener('gc.button.press', function(event) {
	switch (event.detail.name) {
        case 'DPAD_RIGHT':
        case 'RIGHT_SHOULDER':
        case 'RIGHT_SHOULDER_BOTTOM':
            sound_switch.pause();
            sound_switch.currentTime = 0.0;

            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
                if (!carry.nextElementSibling) {
                    sound_switch_error.pause();
                    sound_switch_error.currentTime = 0.0;
                    sound_switch_error.play();
                    return;
                }
            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            carry.nextElementSibling.classList.add('controller-active');
            sound_switch.play();
            break;

        case 'DPAD_LEFT':
        case 'LEFT_SHOULDER':
        case 'LEFT_SHOULDER_BOTTOM':
            sound_switch.pause();
            sound_switch.currentTime = 0.0;

            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
            if (!carry.previousElementSibling) {
                sound_switch_error.pause();
                sound_switch_error.currentTime = 0.0;
                sound_switch_error.play();
                return;
            }
            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            carry.previousElementSibling.classList.add('controller-active');
            sound_switch.play();
            break;
        case 'DPAD_DOWN':
            sound_switch.pause();
            sound_switch.currentTime = 0.0;

            // NEEDS WORK
            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
            
            var pos = carry.getBoundingClientRect(),
                next = document.elementFromPoint(pos.left + 20, carry.scrollTop + pos.top + carry.clientHeight + 20);

            if (!next) {
                sound_switch_error.pause();
                sound_switch_error.currentTime = 0.0;
                sound_switch_error.play();
                return;
            }
            if (next.tagName == 'IMG') {
                next = next.parentElement;
            }
            if (!next.classList.contains('grid-item')) {
                sound_switch_error.pause();
                sound_switch_error.currentTime = 0.0;
                sound_switch_error.play();
                return;
            }

            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }

            /* // Testing positons
            var tst = document.createElement('div');
            tst.style.position = 'absolute';
            tst.style.backgroundColor = 'red';
            tst.style.width = tst.style.height = carry.clientWidth/2 + 20 + 'px';
            tst.style.top = pos.top + carry.clientHeight + 20 + 'px';
            tst.style.left = pos.left + 20 + 'px';
            document.body.appendChild(tst);
            */
            
            
            next.classList.add('controller-active');
            sound_switch.play();
            break;
        case 'DPAD_UP':
            sound_switch.pause();
            sound_switch.currentTime = 0.0;

            // NEEDS WORK
            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
    
            var pos = carry.getBoundingClientRect();
                next = document.elementFromPoint(pos.left + 20, carry.scrollTop + pos.top - carry.clientHeight + 20);
            
            if (!next) {
                sound_switch_error.pause();
                sound_switch_error.currentTime = 0.0;
                sound_switch_error.play();
                return;
            }
            if (next.tagName == 'IMG') {
                next = next.parentElement;
            }
            if (!next.classList.contains('grid-item')) {
                sound_switch_error.pause();
                sound_switch_error.currentTime = 0.0;
                sound_switch_error.play();
                return;
            }

            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }

            /* // Testing positons
            var tst = document.createElement('div');
            tst.style.position = 'absolute';
            tst.style.backgroundColor = 'red';
            tst.style.width = tst.style.height = carry.clientWidth/2 + 20 + 'px';
            tst.style.top = pos.top - carry.clientHeight + 20 + 'px';
            tst.style.left = pos.left + 20 + 'px';
            document.body.appendChild(tst);*/
            
            next.classList.add('controller-active');
            sound_switch.play();
            break;
        default:
            break;
    }
}, false);