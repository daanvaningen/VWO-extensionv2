/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 * vwo-controller.js handles the app layout and is responsible for handling
 * variations changes. Included bij main.html
 */

/* Resets the current page and closes the current window after 1 sec.
 */
function resetCollapse(){
    chrome.runtime.getBackgroundPage(function(eventPage){
        eventPage.reloadPage();
    })
    setTimeout(function(){
        window.close();
    }, 1000);
}


/* Selected boxes onChange function
 * Change a single cookie value when a value gets selected. Take the value
 * of the selected elemented and use the parent element id to set the cookie.
 */
function changeCookie(){
    var selected = this.value;
    var cookie_name = this.parentElement.id;
    var domain;
    chrome.cookies.getAll({
        "name": cookie_name,
    }, function(cookies){
        //Dynamically get domain
        domain = "http://" + cookies[0].domain;
        chrome.cookies.remove({
            "url": domain,
            "name": cookie_name
        }, function() {
            chrome.cookies.set({
                "url": domain,
                "name": cookie_name,
                "value": selected
            }, resetCollapse() // Callback function
            )
        })
    })
}


/* Recursive function to set all the experiments to control. Pop an element
 * from the experiments list and set the cookie value to 1. Continue untill
 * the list is empty
 */
function changeCookies(experimentsCookieNames){
    if(experimentsCookieNames.length === 0 ){
        resetCollapse();
        return;
    }
    cookie_name = experimentsCookieNames.pop();
    console.log(experimentsCookieNames);
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
                changeCookies(experimentsCookieNames); // Callback
            })
        })
    })
}


/* Radio button onclick function.
 * Gathers active experiment names and calls the changeCookies function.
 */
function allExpToControl(){
    var experimentsCookieNames = [];
    var expChilds = document.querySelector('.experiments').children;
    for(var i = 0; i < expChilds.length; i++){
        experimentsCookieNames.push(expChilds[i].id);
    }
    changeCookies(experimentsCookieNames);
}


/* Called by add_experiments(). Adds experiment type information
 */
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


/* Called by add_experiments().
 * Adds experiment name information
 */
function add_exp_name(x, obj){
    var name = obj.name;
    x.innerHTML += '<p>' + name +'</p>';
}


/* Called by add_experiments().
 * Adds select box with correct variation selected
 */
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


/* Called by initVWO.
 * Sets up html elements to add experiment information, if any.
 */
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
    if(i == 0){ // No experiments
        const noExp = document.createElement('div');
        noExp.innerHTML = '<h2> No active experiments </h2>';
        noExp.className = 'no-experiments';
        expdiv.appendChild(noExp);
    }
    else { // Add reset to control radio button
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
    chrome.browserAction.setBadgeText({text:''+0+''})
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


function add_events_header(eventsElement){
    var eventsHeader = document.createElement('P');
    var text = document.createTextNode("Events");
    eventsHeader.appendChild(text);
    eventsElement.appendChild(eventsHeader);

    const garbageBin = document.createElement('img');
    garbageBin.setAttribute('src', 'img/garbageBin.png');
    garbageBin.onclick = function() {
        console.log('click');
        document.getElementById('eventsBox').innerHTML = "";
        chrome.storage.local.clear();
    }
    eventsElement.appendChild(garbageBin);
    // eventsElement.appendChild('<br>');
}


function add_events_box(app){
    const eventsBox = document.createElement('div');
    eventsBox.id = 'eventsBox';
    app.appendChild(eventsBox);
}

let href;
let VWOData;
function initVWO(data){
    const app = document.getElementById('app');
    href = data.curhref;
    if (data.valid === 0)
      notAvailable();
    else if(data.valid === 2)
      noExperimentsData();
    else {
        app.querySelector('.loading').remove();
        VWOData = data;
        console.log(VWOData);

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
        add_events_header(eventsElement);
        add_events_box(app);
        appendGoals();
    }
}


window.addEventListener('load', function(evt) {
    chrome.runtime.getBackgroundPage(function(eventPage){
        eventPage.queryContentScript(initVWO);
    })
});


function getGoalInfo(testNum, goalNum){
    let goalData = VWOData.experiments;
    var type = goalData[testNum].goals[goalNum].type;
    return goalData[testNum].name + ' Goal: ' + goalNum + " -- " + type;
}


function appendGoals(){
    var splitKey;
    var eventsBox = document.getElementById('eventsBox');
    eventsBox.innerHTML = '';
    chrome.storage.local.get(null, function(items) {
        for(key in items){
            if(key != "key" && !key.includes('combi')){
                splitKey = key.split('_');
                console.log(splitKey);
                text = getGoalInfo(splitKey[0], splitKey[2]);
                eventsBox.innerHTML += '<span>'+text+'<span><br>';

            }
        }
    });
}


/* Add key value pair to storage. Update current key value if present.
 */
function setStorage(key, value){
    var storage = chrome.storage.local;
    var obj = {};
    obj[key] += value;
    storage.get(key, function (items){
        if(items.key != undefined) { // Or items["key1"] != undefined
           return;
        }
        else {
            storage.set(obj, function (){
                appendGoals();
            });
        }
    });
}


/* Onchange Listener vwo cookies
 */
chrome.cookies.onChanged.addListener(function(changeInfo) {
    if(changeInfo.cookie.name.includes('_vis_opt_exp_')){
        var str = changeInfo.cookie.name;
        var key = str.substring('_vis_opt_exp_'.length);
        console.log(key);
        setStorage(key, '_vis_opt_exp_');
    }
});
