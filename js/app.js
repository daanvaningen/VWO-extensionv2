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
