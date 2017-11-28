/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 *
 */

(() => {
  // VWO data object
  const VWOData = {};

  // Determines VWO on page and fills data object
  const getVWOData = () => {
    VWOData.valid = 0;
    if (window._vwo_acc_id) {
      VWOData.valid = 1;
      VWOData.accID = window._vwo_acc_id;
      VWOData.userID = window._vwo_uuid;
      VWOData.experiments = window._vwo_exp;
      VWOData.campaignData = window._vwo_campaignData;
      VWOData.curhref = window.location.href;
    }
    else if(window._vwo_code){
        VWOData.valid = 2;
    }
    VWOData.CVPreventDefault = false;

    return VWOData
  }

  // Custom event for content script
  const customVWOEvent = document.createEvent('CustomEvent');
        customVWOEvent.initCustomEvent('VWOData', true, true, getVWOData());

  // Dispatch event
  document.dispatchEvent(customVWOEvent);
})();
