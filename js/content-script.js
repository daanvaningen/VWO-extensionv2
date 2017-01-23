//Create script in DOM to collect VWO data
const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.src = chrome.extension.getURL('/js/dom-script.js');


console.log(window.location.href)
console.log("content-script " + window._vwo_acc_id);

function requestVWOData() {
  let body = document.getElementsByTagName('body')[0];
  $('body').append(scriptEl);
}
requestVWOData();

document.addEventListener('VWOData', function (e){
  // Receive VWO data from script
  const VWOData = e.detail;
  // Send to Chrome Extension
  chrome.runtime.sendMessage(VWOData);

  // Remove script element from page
  scriptEl.remove();
});

// chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
//   console.log('eeeeyeyeyeye');
//   if (msg.greeting == 'hello') {
//     console.log("Message recieved!");
//   }
//   return true; // <-- Required if you want to use sendResponse asynchronously!
// });
