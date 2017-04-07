/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 *
 */

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

function openTab(){
    chrome.tabs.create({url:"http://www.clickvalue.nl"});
}
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//     queryContentScript(initVWO);
// });
