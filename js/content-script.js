/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 *
 */

//Create script in DOM to collect VWO data
const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.src = chrome.extension.getURL('/js/dom-script.js');

const scriptPrevDefault = document.createElement('script');
    scriptPrevDefault.type = 'text/javascript';
    scriptPrevDefault.src = chrome.extension.getURL('/js/prevDefault.js');

let VWOData;
let length;
let body = document.getElementsByTagName('body')[0];

function requestVWOData() {
  body.append(scriptEl);
}


document.addEventListener('VWOData', function (e){
  // Receive VWO data from script
  VWOData = e.detail;

  scriptEl.remove();
});

document.addEventListener('getPrevDefault', function(e){
    console.log(e.detail);
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "VWOData"){
      //body.append(scriptGetVar);
      if(VWOData === undefined){
        requestVWOData();
        var total = 0;
        var delta = 100;
        var d = setInterval(function(){
          total += delta;
          if(VWOData !== undefined || total > 5000){
            clearInterval(d);
            sendResponse(VWOData);
          }
        }, delta);
      }
      else {
        sendResponse(VWOData);
      }
    }
    if(request.message == "Reload"){
      window.location.reload();
    }
    if(request.message == "count_experiments"){
      sendResponse({num_exp:length});
    }
    if(request.message == "prevDefault"){
      if(!VWOData.CVPreventDefault){
        VWOData.CVPreventDefault = true;
        body.append(scriptPrevDefault);
      } else if(VWOData.CVPreventDefault){
        VWOData.CVPreventDefault = false;
      }
    }
  });
  // Remove script element from page

  window.addEventListener("load", function() {
      requestVWOData();
  }, true);
