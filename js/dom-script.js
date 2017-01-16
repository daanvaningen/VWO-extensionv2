// VWO data object
const data = {};

// Custom event for content script
const customVWOEvent = document.createEvent('CustomEvent');
      customVWOEvent.initCustomEvent('VWOData', true, true, JSON.stringify(data));

// Determines VWO on page and fills data object
function getVWOData() {
  if (window._vwo_acc_id) {
    data.valid = 1;
    data.accID = window._vwo_acc_id;
    data.userID = window._vwo_uuid;
    data.experiments = window._vwo_exp;
  } else {
    data.valid = 0;
  }
}

getVWOData();

// Dispatch event
document.dispatchEvent(customVWOEvent);
