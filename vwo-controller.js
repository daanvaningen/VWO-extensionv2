function changeCookie(){
    var selected = this.value;
    var cookie_name = this.parentElement.id;
    var domain;
    chrome.cookies.getAll({
        "name": cookie_name,
    }, function(cookies){
        domain = "http://" + cookies[0].domain;
        chrome.cookies.remove({
            "url": domain,
            "name": cookie_name
        }, function() {
            chrome.cookies.set({
                "url": domain,
                "name": cookie_name,
                "value": selected
            }, function (){
                chrome.runtime.getBackgroundPage(function(eventPage){
                    eventPage.reloadPage();
                })
                setTimeout(function(){
                    window.close();
                }, 1000);
            })
        })
    })

    // chrome.cookies.set({
    //     "name":cookie_name,
    //     "url":href,
    //     "value":selected
    // })
}

var experimentsCookieNames = [];
function changeCookies(){
    console.log(experimentsCookieNames);
    if(experimentsCookieNames.length === 0 ){
        chrome.runtime.getBackgroundPage(function(eventPage){
            eventPage.reloadPage();
        })
        setTimeout(function(){
            window.close();
        }, 1000);
    }
    cookie_name = experimentsCookieNames.pop();
    chrome.cookies.getAll({
        "name": cookie_name,
    }, function(cookies){
        domain = "http://" + cookies[0].domain;
        chrome.cookies.remove({
            "url": domain,
            "name": cookie_name
        }, function() {
            chrome.cookies.set({
                "url": domain,
                "name": cookie_name,
                "value": '1'
            }, function (){
                changeCookies();
            })
        })
    })
}

function allExpToControl(){
    var expChilds = document.querySelector('.experiments').children;
    for(var i = 0; i < expChilds.length; i++){
        experimentsCookieNames.push(expChilds[i].id);
    }
    changeCookies();
}


function add_exp_type(x, obj){
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
    else {
        const reset = document.createElement('div');
            reset.className = 'resetToControl';
            reset.innerHTML = '<span>Set all experiments to control </span>\
                            <label class="control-switch"> \
                            <input type="checkbox"> \
                            <div class="slider round"></div> \
                            </label>';
        const mainInfo = document.getElementsByClassName('mainInformation')[0];
        mainInfo.parentNode.insertBefore(reset, mainInfo.nextSibling);

        const resetRadio = document.querySelector('.resetToControl input');
        resetRadio.onclick = allExpToControl;
        expdiv.setAttribute('style', 'max-height:300px;overflow-y:scroll');
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


function add_events_box(eventsElement){
    const eventsHeader = document.createElement('div');
    eventsHeader.className = 'eventsHeader'
    eventsHeader.innerHTML = '<p>Events:</p>'
    eventsElement.appendChild(eventsHeader);

    const eventsBox = document.createElement('div');
    eventsBox.id = 'eventsBox';
    eventsElement.appendChild(eventsBox);
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

        const eventsElement = document.createElement('div');
        eventsElement.id = 'events';

        mainInfoDiv.appendChild(header);
        mainInfoDiv.appendChild(accElement);
        mainInfoDiv.appendChild(userElement);
        app.appendChild(experimentsElement);
        app.appendChild(eventsElement);

        add_experiments(experiments, campaignData);
        add_events_box(eventsElement);
    }
}


window.addEventListener('load', function(evt) {
    chrome.runtime.getBackgroundPage(function(eventPage){
        eventPage.queryContentScript(initVWO);
    })
});


/* Add key value pair to storage. Update current key value if present.
 */
function setStorage(key, value){
    var storage = chrome.storage.local;
    //
    // storage.get("key1", function (items){
    //     if(items.key1 != undefined) { // Or items["key1"] != undefined
    //        storage.remove("key1", function (){
    //            console.log("Key1 has been removed");
    //        });
    //     }
    //     else {
    //         storage.set({"key1":"value1"}, function (){
    //             console.log("Key1 has been set");
    //         });
    //     }
    // });
    storage.set({key:value}, function (){
        console.log(key);
    });
}
chrome.cookies.onChanged.addListener(function(changeInfo) {
    if(changeInfo.cookie.name.includes('_vis_opt_exp_')){
        console.log(changeInfo);
        setStorage('_vis_opt_exp_', 'x');
        var eventsBox = document.getElementById('eventsBox');
        eventsBox.innerHTML += '<span>vwo goal fired<span><br>'
    }
});
