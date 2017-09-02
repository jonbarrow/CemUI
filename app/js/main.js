const {ipcRenderer} = require('electron'); // Gets ipcRenderer
var games_lib = document.getElementById('games-grid');

function addEvent(object, event, func) {
    object.addEventListener(event, func, true);
}

ipcRenderer.on('init_complete', function(event, data) {
    console.log(data)
    for (var i=0;i<data.length;i++) {
        var game = data[i],
            wrapper = document.createElement('div'),
            box = document.createElement('div');
        
        wrapper.className = 'grid-item';
        if (i == 0) {
            wrapper.classList.add('highlight');
        }
        box.style.background-image = 'url("../cache/images/' + game.title_id + '/box.jpg")';
        wrapper.appendChild(box);
        
        games_lib.appendChild(wrapper);
    }
});

addEvent(window, 'load', function() {
    ipcRenderer.send('init');
});

function closeModal() {
    var modal = document.getElementsByClassName('selected-modal')[0];
    modal.style.opacity = "0";
    setTimeout(function () {
        document.getElementsByClassName('selected-modal')[0].style.display = "none";
        document.getElementsByClassName('selected-modal')[0].classList.remove('selected-modal');
    },500);
    document.getElementById('main').style.filter = 'blur(0px)';
}
function openModal(id) {
    if (document.getElementsByClassName('selected-modal').length > 0) closeModal();
    var modal = document.getElementById(id);
    modal.style.opacity = "0";
    modal.style.display = "block";
    modal.classList.add('selected-modal');
    setTimeout(function () {
        modal.style.opacity = "1";
    },250);
    document.getElementById('main').style.filter = 'blur(3px)';
}
function closeScreen(el) {
    el.parentElement.style.opacity = "0";
    setTimeout(function () {
        el.parentElement.parentElement.style.opacity = "0";
        setTimeout(function () {
            el.parentElement.parentElement.style.display = "none";
            el.parentElement.style.opacity = "1";
        },1000);
    },750);
}
function openScreen(id) {
    var el = document.getElementById(id);
    el.style.display = "inline-block";
    setTimeout(function () {
        el.style.opacity = "1";
    },100);
}






var modalList = document.getElementsByClassName('modal');
for(var i = 0, length = modalList.length; i < length; i++)
{
    modalList.item(i).onclick = function(event) {
        closeModal();
    }
}

var modalchildList = document.getElementsByClassName('modal-content');
for(var i = 0, length = modalchildList.length; i < length; i++)
{
    modalchildList.item(i).onclick = function(event) {
        event.stopPropagation();
    }
}


var closeList = document.getElementsByClassName('close');
for(var i = 0, length = closeList.length; i < length; i++)
{
    closeList.item(i).onclick = function() {
        closeModal();
    }
}

//TODO insert games into grid
//TODO create a modal inserting function. see code below.

/*
    //INSERT THIS CODE INTO ID: 'modal-content-list'

    <div id="modal1" class="modal">

        <div class="modal-content">
            <span class="close">&times;</span>
            <p>the content</p>
        </div>

    </div>

*/