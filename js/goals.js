/*
(function(open) {

    XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {

        this.addEventListener("readystatechange", function() {
            console.log(this.readyState);
        }, false);

        open.call(this, method, url, async, user, pass);
    };

})(XMLHttpRequest.prototype.open);
*/
(() => {
    console.log('goals.js');
var oReq = new XMLHttpRequest();

oReq.addEventListener("progress", updateProgress);
oReq.addEventListener("load", transferComplete);
oReq.addEventListener("error", transferFailed);
oReq.addEventListener("abort", transferCanceled);

oReq.open('GET', 'http://dev.visualwebsiteoptimizer.com');

// ...

// progress on transfers from the server to the client (downloads)
function updateProgress (oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    console.log('updateProgress if');
  } else {
    // Unable to compute progress information since the total size is unknown
    console.log('updateProgress else');
  }
}

function transferComplete(evt) {
  console.log("The transfer is complete.");
}

function transferFailed(evt) {
  console.log("An error occurred while transferring the file.");
}

function transferCanceled(evt) {
  console.log("The transfer has been canceled by the user.");
}

oReq.onreadystatechange = function () {
    console.log('xml: readystatechange');
        if(oReq.readyState === XMLHttpRequest.DONE && oReq.status === 200) {
            console.log(oReq.responseText);
        }
    };
})();
