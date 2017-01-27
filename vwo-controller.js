/*
(function(){
  var cv_vwo = this;

  this.init = function() {

    if(!this.loadJquery()){return;}
    this.jQuery('#cv-vwo').remove();
    this.loadStyle();
    this.jQuery( 'body' ).append( "<div id='cv-vwo'><div id='cv-vwo_header'><span id='cv-vwo_title'>VWO campaigns</span><span id='cv-vwo_settings'><span id='cv-vwo_minimize'>-</span></span></div><div id='cv-vwo_content'></div></div>" );
    this.content = this.jQuery('#cv-vwo_content');
    this.loadCampaigns();
    this.loadDraggable();
  };

  this.loadCampaigns = function() {
    var campaigns = window._vwo_exp;
    for(var campaign in campaigns){
      if(!campaigns.hasOwnProperty(campaign)){continue;}
      name = campaigns[campaign].name.replace("\'", '&#39;').replace("\"","&quot;");
      this.content.append("<div class='cv-vwo_campaign' campaign_id='{campaign.id}'><span class='cv-vwo_campaign-name' title='{campaign.name}'>{campaign.name}</span><span class='cv-vwo_campaign-variation'><select></select></span></div>".replace('{campaign.id}', campaign).replace('{campaign.name}', name).replace('{campaign.name}', name));
      var variations = campaigns[campaign].comb_n;
      var variation_select = this.jQuery('.cv-vwo_campaign[campaign_id="'+campaign+'"] select');
      for(var variation in variations){
        if(!variations.hasOwnProperty(variation)){continue;}
        var_name = variations[variation].replace("\'", '&#39;').replace("\"","&quot;");
        variation_select.append('<option val="{variation.id}">{variation.name}</option>'.replace('{variation.id}',variation).replace('{variation.name}', var_name));
      }
      var comb_chosen = campaigns[campaign].combination_chosen;
      this.jQuery('.cv-vwo_campaign[campaign_id="'+campaign+'"] select option[val="'+comb_chosen+'"]').attr('selected', true);
      variation_select.change(this.set_variation);
    }
  };

  this.set_variation = function(ev) {
    var campaign = cv_vwo.jQuery(ev.target).closest('.cv-vwo_campaign').attr('campaign_id');
    var variation = cv_vwo.jQuery(ev.target).find('option:selected').attr('val');
    document.cookie = "_vis_opt_exp_{campaign}_combi={variation};path=/;domain={domain};".replace('{campaign}', campaign).replace('{variation}', variation).replace('{domain}', window.location.host.replace('www',''));
    location.reload();
  };

  this.loadJquery = function() {
    if(jQuery) { this.jQuery = jQuery; }
    else if ($) { this.jQuery = $; }
    else { console.log( 'no jQuery' ); return 0;}
    return 1;
  };

  this.loadStyle = function() {
    this.jQuery('head').append("<style>#cv-vwo {z-index:9999999999;width:300px;position:fixed;top:10px;right:10px;}#cv-vwo{border:1px solid black;}#cv-vwo_header{cursor:move;background:blue;color:white;font-weight:bold;padding:5px 10px;}#cv-vwo_settings{float:right;}#cv-vwo_minimize{background-color:orange;height:15px;padding:0px 4px;color:white;cursor:pointer;vertical-align:middle;text-align:center;}#cv-vwo_content{background:white;color:black;padding-bottom:10px;}.cv-vwo_campaign-name{width:50%;text-overflow: ellipsis;display:inline-block;overflow:hidden;white-space:nowrap; padding:2px 5px;}.cv-vwo_campaign-variation select{width:130px;}</style>");
  };

  this.loadDraggable = function(){
    this.jQuery('#cv-vwo_header').on('mousedown',cv_vwo.initiate_drag);
  };
  this.initiate_drag = function(ev){
    cv_vwo.dragging = {};
    cv_vwo.dragging.pageX0 = ev.pageX;
    cv_vwo.dragging.pageY0 = ev.pageY;
    cv_vwo.dragging.offset0 = cv_vwo.jQuery(this).offset();
    cv_vwo.jQuery('body').on('mouseup', cv_vwo.stop_drag);
    cv_vwo.jQuery('body').on('mousemove', cv_vwo.drag);
  };
  this.stop_drag = function(){
    cv_vwo.jQuery('body').off('mouseup', cv_vwo.stop_drag);
    cv_vwo.jQuery('body').off('mousemove', cv_vwo.drag);
  };
  this.drag = function(ev){
    var left = cv_vwo.dragging.offset0.left + (ev.pageX - cv_vwo.dragging.pageX0);
    var top = cv_vwo.dragging.offset0.top + (ev.pageY - cv_vwo.dragging.pageY0);
    cv_vwo.jQuery('#cv-vwo').css({top:top,left:left});
  };


  this.init();

})();
*/

function notAvailable() {
    app.querySelector('.loading').remove();
    const notFound = document.createElement('div');
          notFound.innerHTML = 'VWO not found on this page';
    app.appendChild(notFound);
}

function initVWO(data){
    const app = document.getElementById('app');
    if (data.valid === 0) {
      console.log('VWO not available');
      notAvailable();
    }
    else {
        app.querySelector('.loading').remove();
        const VWOData = data;

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
}

window.addEventListener('load', function(evt) {
    chrome.runtime.getBackgroundPage(function(eventPage){
        eventPage.queryContentScript(initVWO);
    })
});
