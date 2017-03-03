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

function changeCookie(){
    var selected = this.value;
    var cookie_name = this.parentElement.id;
    var domain;
    chrome.cookies.getAll({
        "name": cookie_name,
    }, function(cookies){
        console.log('cookie found');
        domain = "http://" + cookies[0].domain;
        chrome.cookies.remove({
            "url": domain,
            "name": cookie_name
        }, function() {
            console.log('cookie removed');
            chrome.cookies.set({
                "url": domain,
                "name": cookie_name,
                "value": selected
            }, function (){
                chrome.runtime.getBackgroundPage(function(eventPage){
                    eventPage.reloadPage();
                })
            })
        })
    })

    // chrome.cookies.set({
    //     "name":cookie_name,
    //     "url":href,
    //     "value":selected
    // })
}

function add_exp_type(x, obj){
    console.log(obj)
    var type = obj.type;
    switch (type) {
        case "SPLIT_URL":
            x.innerHTML += '<p> Split url test</p>';
            break;
        case "VISUAL_AB":
            x.innerHTML += '<p> A/B test</p>';
            break;
        default:
            x.innerHTML += '<p> Unknown test type</p>';
    }
}

function add_exp_name(x, obj){
    var name = obj.name;
    x.innerHTML += '<p>' + name +'</p>';
}


function add_vars(x, exp, campD){
    var variations = exp.comb_n;
    var dropdown = document.createElement('select');
    var i = 1;
    dropdown.onchange = changeCookie;
    dropdown.className = 'variation_select'

    for(var key in variations){
        var text = variations[key];
        if(campD.c === key){
            dropdown.innerHTML += '<option value="'+i+'" selected>'+text+'('+Math.round(exp.combs[key]*100)+'%)</option>';
        } else {
            dropdown.innerHTML += '<option value="'+i+'">'+text+'('+Math.round(exp.combs[key]*100)+'%)</option>';
        }
        i++;
    }
    x.appendChild(dropdown);
}


function add_experiments(experiments, campaignData){
    var i = 0;
    const expdiv = document.getElementsByClassName('experiments')[0];

    for(var key in experiments){
        if(experiments.hasOwnProperty(key) && campaignData.hasOwnProperty(key)){
            i ++;
            var exp = experiments[key];
            var campD = campaignData[key];
            var x = document.createElement('div')
            x.className = 'experiment' + i;
            x.id = '_vis_opt_exp_'+key+'_combi';
            add_exp_type(x, exp);
            add_exp_name(x, exp);
            add_vars(x, exp, campD);
            expdiv.appendChild(x);
        }
    }
    if(i == 0){
        const noExp = document.createElement('div');
        noExp.innerHTML = '<h2> No active experiments </h2>';
        noExp.className = 'no-experiments';
        expdiv.appendChild(noExp);
    }

    // chrome.browserAction.setBadgeText({text:''+i+''})
}


function notAvailable() {
    app.querySelector('.loading').remove();
    const notFound = document.createElement('div');
    notFound.className = 'VWONotFound'
          notFound.innerHTML = '<h1>VWO not found on this page</h1>';
    app.appendChild(notFound);
}

function noExperimentsData() {
    app.querySelector('.loading').remove();
    const mainInfo = document.createElement('div');
    mainInfo.className = 'mainInformation';
    app.appendChild(mainInfo);

    const mainInfoDiv = document.getElementsByClassName('mainInformation')[0];

    const header = document.createElement('div');
        header.innerHTML = '<h1> VWO is running on this page </h1>';
    header.className = 'header';
    const accElement = document.createElement('div');
          accElement.innerHTML = '<h3> No account data found </h3>';
    accElement.className = 'accountID';

    const experimentsElement = document.createElement('div');
    experimentsElement.className = 'experiments';

    mainInfoDiv.appendChild(header);
    mainInfoDiv.appendChild(accElement);
    app.appendChild(experimentsElement);

    const expdiv = document.getElementsByClassName('experiments')[0];
    const noExp = document.createElement('div');
    noExp.innerHTML = '<h2> No active experiments </h2>';
    noExp.className = 'no-experiments';
    expdiv.appendChild(noExp);
}

let href;
function initVWO(data){
    const app = document.getElementById('app');
    href = data.curhref;
    if (data.valid === 0)
      notAvailable();
    else if(data.valid === 2)
      noExperimentsData();
    else {
        app.querySelector('.loading').remove();
        const VWOData = data;

        const mainInfo = document.createElement('div');
        mainInfo.className = 'mainInformation';
        app.appendChild(mainInfo);

        const mainInfoDiv = document.getElementsByClassName('mainInformation')[0];

        const header = document.createElement('div');
            header.innerHTML = '<h1> VWO is running on this page </h1>';
        header.className = 'header';

        const accID = VWOData.accID;
        const userID = VWOData.userID;
        const experiments = VWOData.experiments;
        const campaignData = VWOData.campaignData;

        const accElement = document.createElement('div');
              accElement.innerHTML = '<h3> Account ID: ' + accID + '</h3>';
        accElement.className = 'accountID';

        const userElement = document.createElement('div');
              userElement.innerHTML = '<h3> User ID: ' + userID +'</h3>';
        userElement.className = 'userID';

        const experimentsElement = document.createElement('div');
        experimentsElement.className = 'experiments';


        mainInfoDiv.appendChild(header);
        mainInfoDiv.appendChild(accElement);
        mainInfoDiv.appendChild(userElement);
        app.appendChild(experimentsElement);

        add_experiments(experiments, campaignData);
    }
}


window.addEventListener('load', function(evt) {
    chrome.runtime.getBackgroundPage(function(eventPage){
        eventPage.queryContentScript(initVWO);
    })
});
