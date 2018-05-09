/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 *
 */

(() => {
  // VWO data object
  const VWOData = {};

  const getVWOData = () => {
    let account_ID;
    var scripts = document.getElementsByTagName("script");
    for (var i=0;i<scripts.length;i++){
      if (scripts[i].src){
        if(scripts[i].src.indexOf('_vwo_code') > -1){
          let x = scripts[i].innerHTML;
          account_ID = x.match(/account\_id(\s)?=(\s)?\d{1,}/i);
          account_ID = parseInt(account_ID[0].split('=')[1]);
        }
      }
      else {
        if(scripts[i].innerHTML.indexOf('_vwo_code') > -1){
          let x = scripts[i].innerHTML;
          account_ID = x.match(/account\_id(\s)?=(\s)?\d{1,}/i);
          account_ID = parseInt(account_ID[0].split('=')[1]);
        }
      }
    }

    console.log(account_ID);
    if(account_ID !== undefined){
      VWOData.is_vwo_page = true;
      VWOData.account_ID = account_ID;
    }
    else {
      VWOData.is_vwo_page = false;
    }

    return VWOData;
  }

  // Custom event for content script
  const customVWOEvent = document.createEvent('CustomEvent');
        customVWOEvent.initCustomEvent('VWOData', true, true, getVWOData());

  // Dispatch event
  document.dispatchEvent(customVWOEvent);
})();
