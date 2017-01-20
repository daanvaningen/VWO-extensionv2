// alert('content script');

// Create script in DOM to collect VWO data
const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.src = chrome.extension.getURL('/js/dom-script.js');

const body = document.getElementsByTagName('body')[0];

function requestVWOData() {
  body.appendChild(scriptEl);
}
requestVWOData();

document.addEventListener('VWOData', function (e){
  // Receive VWO data from script
  const VWOData = e.detail;
  console.log(VWOData);

  // Send to Chrome Extension
  chrome.runtime.sendMessage(JSON.stringify(VWOData));

  // Remove script element from page
  scriptEl.remove();
});
