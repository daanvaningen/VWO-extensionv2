(() => {
  // VWO data object
  const VWOData = {};

  // Determines VWO on page and fills data object
  const getVWOData = () => {
    if (window._vwo_acc_id) {
      console.log('dom script vwo defined')
      VWOData.valid = 1;
      VWOData.accID = window._vwo_acc_id;
      VWOData.userID = window._vwo_uuid;
      VWOData.experiments = window._vwo_exp;
    } else {
      console.log('dom-script vwo not defined')
      VWOData.valid = 0;
    }
    return VWOData
  }

  // Custom event for content script
  const customVWOEvent = document.createEvent('CustomEvent');
        customVWOEvent.initCustomEvent('VWOData', true, true, getVWOData());

  // Dispatch event
  document.dispatchEvent(customVWOEvent);
})();
