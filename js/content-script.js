//Create script in DOM to collect VWO data
const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.src = chrome.extension.getURL('/js/dom-script.js');

let VWOData;
function requestVWOData() {
  let body = document.getElementsByTagName('body')[0];
  body.append(scriptEl);
  return true;
}

let VWOData;
document.addEventListener('VWOData', function (e){
  // Receive VWO data from script
  VWOData = e.detail;
 // Remove script element from page
  scriptEl.remove();
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "VWOData"){

        let VWOPromise = new Promise(
            function (resolve, reject) {
                if(requestVWOData()){
                    resolve(VWOData);
                }
            }
        );

        VWOPromise
            .then(sendResponse(VWOData))
    }
  });
// chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
//   console.log('eeeeyeyeyeye');
//   if (msg.greeting == 'hello') {
//     console.log("Message recieved!");
//   }
//   return true; // <-- Required if you want to use sendResponse asynchronously!
// });
