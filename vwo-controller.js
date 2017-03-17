function changeCookie(doReload){
  console.log(doReload);
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
    dropdown.setAttribute('onchange', 'changeCookie(true)');
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
