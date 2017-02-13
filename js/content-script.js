//Create script in DOM to collect VWO data
const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.src = chrome.extension.getURL('/js/dom-script.js');

let VWOData;
let length;
// console.log(window);
// console.log("content-script " + window._vwo_acc_id);
window.addEventListener("load", function() {
    requestVWOData();
}, true);

function requestVWOData() {
  let body = document.getElementsByTagName('body')[0];
  body.append(scriptEl);
}


document.addEventListener('VWOData', function (e){
  // Receive VWO data from script
  VWOData = e.detail;
  scriptEl.remove();
  length = Object.keys(VWOData.experiments).length;
  chrome.runtime.sendMessage({message: "count_experiments"});
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "VWOData"){
      sendResponse(VWOData);
    }
    if(request.message == "Reload"){
        window.location.reload();
    }
  });
  // Remove script element from page


// chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
//   console.log('eeeeyeyeyeye');
//   if (msg.greeting == 'hello') {
//     console.log("Message recieved!");
//   }
//   return true; // <-- Required if you want to use sendResponse asynchronously!
// });
