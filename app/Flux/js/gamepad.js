const CEMU_BUTTON_NAMES = {
    gamepad: {
        A: 1,
        B: 2,
        X: 3,
        Y: 4,
        L: 5,
        R: 6,
        ZL: 7,
        RL: 8,
        "+": 9,
        "-": 10,
        "dpad-up": 11,
        "dpad-down": 12,
        "dpad-left": 13,
        "dpad-right": 14,
        "l-click": 15,
        "l-up": 17,
        "l-down": 18,
        "l-left": 19,
        "l-right": 20,
        "r-click": 16,
        "r-up": 21,
        "r-down": 22,
        "r-left": 23,
        "r-right": 24,
        blowmic: 25,
        showscreen: 26
    }
}

const CEMU_BUTTON_MAPPINGS = {
    FACE_1: 'button_1',
    FACE_2: 'button_2',
    FACE_3: 'button_4',
    FACE_4: 'button_8',
    LEFT_SHOULDER: 'button_10',
    RIGHT_SHOULDER: 'button_20',
    LEFT_SHOULDER_BOTTOM: 'button_100000000',
    RIGHT_SHOULDER_BOTTOM: 'button_4000000000',
    START: 'button_80',
    SELECT: 'button_40',
    LEFT_ANALOG_BUTTON: 'button_100',
    LEFT_ANALOG_STICK_UP: 'button_2000000000',
    LEFT_ANALOG_STICK_DOWN: 'button_80000000',
    LEFT_ANALOG_STICK_LEFT: 'button_1000000000',
    LEFT_ANALOG_STICK_RIGHT: 'button_40000000',
    RIGHT_ANALOG_BUTTON: 'button_200',
    RIGHT_ANALOG_STICK_UP: 'button_10000000000',
    RIGHT_ANALOG_STICK_DOWN: 'button_400000000',
    RIGHT_ANALOG_STICK_LEFT: 'button_8000000000',
    RIGHT_ANALOG_STICK_RIGHT: 'button_200000000',
    DPAD_UP: 'button_4000000',
    DPAD_DOWN: 'button_8000000',
    DPAD_LEFT: 'button_10000000',
    DPAD_RIGHT: 'button_20000000'
}

ipcRenderer.on('controller_found', function(event, data) {
    console.log('found')
    
}, false);

ipcRenderer.on('controller_button_press', function(event, data) {
    switch (data.name) {
        case 'DPAD_UP':
            var current_highlighted = document.querySelector('.highlighted');
            if (current_highlighted.id == 'library') {
                if (document.querySelector('.selected')) {
                    document.querySelector('.selected').classList.remove('selected');
                }
            }
            current_highlighted.classList.remove('highlighted');
            document.querySelector('#recent').classList.add('highlighted');
            break;
        case 'DPAD_DOWN':
            var current_highlighted = document.querySelector('.highlighted');
            if (current_highlighted.id == 'recent') {
                if (document.querySelector('.selected')) {
                    document.querySelector('.selected').classList.remove('selected');
                }
            }
            current_highlighted.classList.remove('highlighted');
            document.querySelector('#library').classList.add('highlighted');
            break;
        case 'DPAD_RIGHT':
            var current_highlighted = document.querySelector('.highlighted'),
                current_selected = current_highlighted.querySelector('.selected');
            if (!current_selected) {
                current_highlighted.firstElementChild.classList.add('selected');
                current_highlighted.querySelector('.selected').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'end'
                });;
            } else {
                current_selected.nextElementSibling.classList.add('selected');
                current_selected.nextElementSibling.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'end'
                });
                current_selected.classList.remove('selected');
            }
            current_highlighted.scrollLeft += 25;
            break;
        case 'DPAD_LEFT':
            var current_highlighted = document.querySelector('.highlighted'),
                current_selected = current_highlighted.querySelector('.selected');
            if (!current_selected) {
                current_highlighted.firstElementChild.classList.add('selected');
                current_highlighted.querySelector('.selected').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'end'
                });
            } else {
                current_selected.previousElementSibling.classList.add('selected');
                current_selected.previousElementSibling.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'end'
                });
                current_selected.classList.remove('selected');
            }
            current_highlighted.scrollLeft -= 25;
            break;
        case 'START': //Start XBox
            //start game without modal
            break;
        case 'FACE_1': //A button XBox
            if (document.querySelector('.selected')) {
                document.querySelector('.selected').click();
            }
            break;
        case 'FACE_2': // B button XBox
            //close modal
            break;
        default:
            break;
    }
    
    console.log(data.name)
}, false);

function checkGamepadCursor() {

}