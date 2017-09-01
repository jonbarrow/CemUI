Controller.search({
    settings: {
        useAnalogAsDpad: "both"
    }
});

window.addEventListener('gc.controller.found', function(event) {
    var games = document.getElementById('games-grid').getElementsByClassName('item');
    if (!games[0]) return;

    games[0].classList.add('controller-active');

}, false);

window.addEventListener('gc.button.press', function(event) {
	switch (event.detail.name) {
        case 'DPAD_RIGHT':
        case 'RIGHT_SHOULDER':
        case 'RIGHT_SHOULDER_BOTTOM':
            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
            if (!carry.nextElementSibling) return;
            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            carry.nextElementSibling.classList.add('controller-active');
            break;

        case 'DPAD_LEFT':
        case 'LEFT_SHOULDER':
        case 'LEFT_SHOULDER_BOTTOM':
            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
            if (!carry.previousElementSibling) return;
            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            carry.previousElementSibling.classList.add('controller-active');
            break;
        case 'DPAD_DOWN':
            /* // NEEDS WORK
            var current_selected = document.getElementsByClassName('controller-active'),
                carry = current_selected[0];
            for (var i=current_selected.length-1;i>=0;i--) {
                current_selected[i].classList.remove('controller-active');
            }
            var pos = carry.getBoundingClientRect(),
                next = document.elementFromPoint(pos.left, carry.scrollTop + carry.clientHeight + carry.clientHeight/2);
            
            if (next.tagName == 'img') {
                next = next.parentElement;
            }
            
            if (!next.classList.contains('game')) return;
            next.classList.add('controller-active');*/
            break;
    
        default:
            break;
    }
}, false);