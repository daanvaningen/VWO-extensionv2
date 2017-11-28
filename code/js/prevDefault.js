(() => {
    var x = document.querySelectorAll('*');
    for(var i = 0; i < x.length; i++){
        x[i].addEventListener('click', function(event){
            event.preventDefault();
        });
    }
})();
