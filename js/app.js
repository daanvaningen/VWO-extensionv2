/*
((d, w) => {
  const app = d.getElementById('app');
  function queryContentScript(callback){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {message: "VWOData"}, function(data) {
          callback(data);
      });
    });
  }
  // ASDASDASDASD
  // on click reset het elke keer
  // store data ?
  // http://stackoverflow.com/questions/5364062/how-can-i-save-information-locally-in-my-chrome-extension
  // hier iets mee of localstorage of andere aanpak idk

  // Eventlistener for content script
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    console.log(request);
    console.log(request.valid);

    // Validity checks if VWO is on page
    if (request.valid === 0) {
      notAvailable();
      console.log('VWO not available');
    } else if (request.valid === 1){
      initVWO(request);
      console.log('VWO available');
    }
  });

  // If VWO is not on site
  function notAvailable() {
    app.querySelector('.loading').remove();
    const notFound = document.createElement('div');
          notFound.innerHTML = 'VWO not found on this page';
    app.appendChild(notFound);
  }

  // If VWO is on site
  function initVWO(data){
    app.querySelector('.loading').remove();
    const VWOData = JSON.parse(data);

    const accID = VWOData.accID;
    const userID = VWOData.userID;
    const experiments = VWOData.experiments;

    const accElement = document.createElement('div');
          accElement.innerHTML = accID;

    const userElement = document.createElement('div');
          userElement.innerHTML = userID;

    const experimentsElement = document.createElement('div');

    app.appendChild(accElement);
    app.appendChild(userElement);
    app.appendChild(experimentsElement);
  }
})(document, window);


chrome.browserAction.onClicked.addListener(function (tab) { //Fired when User Clicks ICON
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {message: "VWOData"}, function(response) {
            // Validity checks if VWO is on page
            chrome.tabs.create({url: "main.html"});
            if (response.valid === 0) {
              notAvailable();
          } else if (response.valid === 1){
              initVWO(request);
            }
      });
    });
}); */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      console.log('received');
    if (request.message == "count_experiments")
      console.log(request.count);
  });


function reloadPage(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {message: "Reload"})
    });
}

function queryContentScript(callback){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {message: "VWOData"}, function(data) {
          callback(data);
      });
    });
}
