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

function openCVTab(){
  chrome.tabs.create({url:"http://www.clickvalue.nl"});
}

function openDevTokenTab(){
  chrome.tabs.create({url:"http://app.vwo.com/#/developers/tokens"});
}

function prevDefault(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "prevDefault"});
    });
}
