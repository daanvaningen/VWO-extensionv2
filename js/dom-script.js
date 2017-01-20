(() => {
  // VWO data object
  const VWOData = {};

  // Determines VWO on page and fills data object
  const getVWOData = () => {
    if (window._vwo_acc_id) {
      VWOData.valid = 1;
      VWOData.accID = window._vwo_acc_id;
      VWOData.userID = window._vwo_uuid;
      VWOData.experiments = window._vwo_exp;
    } else {
      VWOData.valid = 0;
    }
    return VWOData
  }

  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //   chrome.tabs.sendMessage(tabs.id[0], {greeting: "hello"}, function(response) {
  //     console.log('heee');
  //   });
  // });

  // Custom event for content script
  const customVWOEvent = document.createEvent('CustomEvent');
        customVWOEvent.initCustomEvent('VWOData', true, true, getVWOData());

  // Dispatch event
  document.dispatchEvent(customVWOEvent);
})();
