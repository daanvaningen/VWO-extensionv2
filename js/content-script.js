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

const scriptE2 = document.createElement('script');
      scriptE2.type = 'text/javascript';
      scriptE2.src = chrome.extension.getURL('/js/goals.js');

const scriptE3 = document.createElement('script');
    scriptE3.type = 'text/javascript';
    scriptE3.src = chrome.extension.getURL('/js/ajaxHook.js');

let VWOData;
let length;
let body = document.getElementsByTagName('body')[0];
// body.append(scriptE2);
// body.append(scriptE3);

// console.log(window);
// console.log("content-script " + window._vwo_acc_id);
window.addEventListener("load", function() {
    requestVWOData();
}, true);

function requestVWOData() {
  // let body = document.getElementsByTagName('body')[0];
  body.append(scriptEl);
}


document.addEventListener('VWOData', function (e){
  // Receive VWO data from script
  VWOData = e.detail;
  // if (VWOData.valid === 1){
  //   body.append(scriptE3);
  // }
  scriptEl.remove();
  // length = Object.keys(VWOData.experiments).length;
});


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "VWOData"){
      sendResponse(VWOData);
    }
    if(request.message == "Reload"){
        window.location.reload();
    }
    if(request.message == "count_experiments"){
        sendResponse({num_exp:length});
    }
  });
  // Remove script element from page
