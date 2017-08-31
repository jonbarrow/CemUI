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
    var modal = document.getElementById(id);
    modal.style.opacity = "0";
    modal.style.display = "block";
    modal.classList.add('selected-modal');
    setTimeout(function () {
        modal.style.opacity = "1";
    },250);
    document.getElementById('main').style.filter = 'blur(3px)';
}

var modalList = document.getElementsByClassName('modal');
for(var i = 0, length = modalList.length; i < length; i++)
{
    modalList.item(i).onclick = function() {
        closeModal();
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