/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 * vwo-controller.js handles the app layout and is responsible for handling
 * variations changes. Included by main.html
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


/* delete a set cookie for a given expID and goal ID
 */
function removeGoalCookie(expID, goalID){
    var cookieName = '_vis_opt_exp_' + expID + '_goal_' + goalID;
    var domain;
    console.log(cookieName);
    chrome.cookies.getAll({
        "name": cookieName,
    }, function(cookies){
        domain = "http://" + cookies[0].domain;
        chrome.cookies.remove({
            "url": domain,
            "name": cookieName
        }, function(){
            console.log("removed cookie with name: " + cookieName);
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


/* Activate preventDefault. If its already active reload the page
 */
function prevDefault(){
    if(!VWOData.CVPreventDefault){
        VWOData.CVPreventDefault = true;
        chrome.runtime.getBackgroundPage(function(eventPage){
            eventPage.prevDefault();
        })
    } else {
        resetCollapse();
    }
}


/* Hide an unhiden element and unhide a hidden element
 */
function toggleVisibility(elem){
    if(elem != undefined){
        if(elem.style.display == 'none') elem.style.display = 'block';
        else elem.style.display = 'none';
    }
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

/* Add campaign information to the experiment div when campaignData is not undefined
 * in the VWOData object
 */
function add_vars_no_camp_data(x, exp){
    var variations = exp.comb_n;
    var dropdown = document.createElement('select');
    var i = 1;
    dropdown.onchange = changeCookie;
    dropdown.className = 'variation_select'

    for(var key in variations){
        var text = variations[key];
        if(key === 1){
            dropdown.innerHTML += '<option value="'+i+'" selected>'+text+'('+Math.round(exp.combs[key]*100)+'%)</option>';
        } else {
            dropdown.innerHTML += '<option value="'+i+'">'+text+'('+Math.round(exp.combs[key]*100)+'%)</option>';
        }
        i++;
    }
    x.appendChild(dropdown);
}


/* Add the extra information ribbon to and experiment.
 * Ribbon contains: JS code button, CSS code button and goals button.
 * Bind the onclicks on the buttons
 */
function createExtraInfoElem(index){
    var infoWrapper = document.createElement('div');
        infoWrapper.className = 'extraInfo' + index;

    var codeBox = document.createElement('div');
        codeBox.className = 'codeIcon';
        var imgCodeIcon = document.createElement('img');
            imgCodeIcon.setAttribute('src', 'img/javascripticon.png')
            codeBox.appendChild(imgCodeIcon);
        var hoverTextJS = document.createElement('span');
            hoverTextJS.className = 'tooltipText';
            hoverTextJS.innerText = 'JavaScript';
            codeBox.appendChild(hoverTextJS);
        infoWrapper.appendChild(codeBox);

    codeBox.onclick = function(currentIndex){
        return function(){
            // document.getElementById('editorCSS'+currentIndex).style.display = 'none';
            toggleVisibility(document.getElementById('editorJS'+currentIndex));
            // var infoElems = document.querySelectorAll('.experiments > div[class^="extraInfo"]');
            // var expElems = document.querySelectorAll('.experiments > div[class^="experiment"]');
            // for(var i = 0; i < infoElems.length; i++){
            //     if(i == currentIndex - 1){
            //         toggleVisibility(expElems[i]);
            //     }
            //     else {
            //         toggleVisibility(expElems[i]);
            //         toggleVisibility(infoElems[i]);
            //     }
            // }
        }
    }(index)


    var codeBoxCSS = document.createElement('div');
        codeBoxCSS.className = 'codeIconCSS';
        var imgCodeIconCSS = document.createElement('img');
            imgCodeIconCSS.setAttribute('src', 'img/cssicon.png')
            codeBoxCSS.appendChild(imgCodeIconCSS);
        var hoverTextCSS = document.createElement('span');
            hoverTextCSS.className = 'tooltipText';
            hoverTextCSS.innerText = 'CSS';
            codeBoxCSS.appendChild(hoverTextCSS);
        infoWrapper.appendChild(codeBoxCSS);

    codeBoxCSS.onclick = function(currentIndex){
        return function(){
            //document.getElementById('editorJS'+currentIndex).style.display = 'none';
            toggleVisibility(document.getElementById('editorCSS'+currentIndex));
            // var infoElems = document.querySelectorAll('.experiments > div[class^="extraInfo"]');
            // var expElems = document.querySelectorAll('.experiments > div[class^="experiment"]');
            // for(var i = 0; i < infoElems.length; i++){
            //     if(i == currentIndex - 1){
            //         toggleVisibility(expElems[i]);
            //     }
            //     else {
            //         toggleVisibility(expElems[i]);
            //         toggleVisibility(infoElems[i]);
            //     }
            // }
        }
    }(index)

    var goalsBox = document.createElement('div');
        goalsBox.className = 'goalsIcon';
        var imgGoalsIcon = document.createElement('img');
            imgGoalsIcon.setAttribute('src', 'img/goalsicon.png')
            goalsBox.appendChild(imgGoalsIcon);
        var hoverTextGoals = document.createElement('span');
            hoverTextGoals.className = 'tooltipText';
            hoverTextGoals.innerText = 'Goals';
            goalsBox.appendChild(hoverTextGoals);
        infoWrapper.appendChild(goalsBox);

    goalsBox.onclick = function(currentIndex){
        return function(){
            //document.getElementById('editorJS'+currentIndex).style.display = 'none';
            toggleVisibility(document.getElementById('goalsList'+currentIndex));
            // var infoElems = document.querySelectorAll('.experiments > div[class^="extraInfo"]');
            // var expElems = document.querySelectorAll('.experiments > div[class^="experiment"]');
            // for(var i = 0; i < infoElems.length; i++){
            //     if(i == currentIndex - 1){
            //         toggleVisibility(expElems[i]);
            //     }
            //     else {
            //         toggleVisibility(expElems[i]);
            //         toggleVisibility(infoElems[i]);
            //     }
            // }
        }
    }(index)
/*
    var codeBoxGlobal = document.createElement('div');
        codeBoxGlobal.className = 'codeIconGlobal';
        var imgCodeIconGlobal = document.createElement('img');
            imgCodeIconGlobal.setAttribute('src', 'img/globalicon.png')
            codeBoxGlobal.appendChild(imgCodeIconGlobal);
        var hoverTextGlobal = document.createElement('span');
            hoverTextGlobal.className = 'tooltipText';
            hoverTextGlobal.innerText = 'Global';
            codeBoxGlobal.appendChild(hoverTextGlobal);
        infoWrapper.appendChild(codeBoxGlobal);

    codeBoxGlobal.onclick = function(currentIndex){
        return function(){
            //document.getElementById('editorJS'+currentIndex).style.display = 'none';
            toggleVisibility(document.getElementById('editorGlobal'+currentIndex));
            // var infoElems = document.querySelectorAll('.experiments > div[class^="extraInfo"]');
            // var expElems = document.querySelectorAll('.experiments > div[class^="experiment"]');
            // for(var i = 0; i < infoElems.length; i++){
            //     if(i == currentIndex - 1){
            //         toggleVisibility(expElems[i]);
            //     }
            //     else {
            //         toggleVisibility(expElems[i]);
            //         toggleVisibility(infoElems[i]);
            //     }
            // }
        }
    }(index)*/
/*
    var settingsBox = document.createElement('div');
        settingsBox.className = 'settingsIcon';
        var imgSettingsIcon = document.createElement('img');
            imgSettingsIcon.setAttribute('src', 'img/settingsicon.png')
            settingsBox.appendChild(imgSettingsIcon);
        infoWrapper.appendChild(settingsBox);

    settingsBox.onclick = function(currentIndex){
        return function(){
            var infoElems = document.querySelectorAll('.experiments > div[class^="extraInfo"]');
            var expElems = document.querySelectorAll('.experiments > div[class^="experiment"]');
            for(var i = 0; i < infoElems.length; i++){
                if(i == currentIndex - 1){
                    toggleVisibility(expElems[i]);
                }
                else {
                    toggleVisibility(expElems[i]);
                    toggleVisibility(infoElems[i]);
                }
            }
        }
    }(index)*/

    return infoWrapper;
}


/* Create the div containing the table holding the goals information
 */
function createGoalsDiv(expData, index){
    var goalsObj = expData.goals;
    // console.log(goalsObj, typeof(goalsObj));
    var temp = ""
    var goalNum, goalType, goalTrigger;
    for(key in goalsObj){
        goalNum = key;
        goalType = goalsObj[key].type;
        goalTrigger = goalsObj[key].url || goalsObj[key].pUrl
        temp += `<tr>
        <td>${goalNum}</td>
        <td>${goalType}</td>
        <td>${goalTrigger}</td>
        </tr>`
    }

    var goalsDiv = document.createElement('div');
        goalsDiv.id = 'goalsList'+index;
        goalsDiv.style.display = 'none';

    goalsDiv.innerHTML = `<table>
                            <tr>
                                <th>#</th>
                                <th>Type</th>
                                <th>Goal Trigger</th>
                            </tr>
                            ${temp}
                        </table>`
    return goalsDiv;
}


/* Create an div with a specific index and type as ID. This div with this ID and
 * type will be used by the ace editor.
 */
function createEditorDiv(index, type){
    var editorDiv = document.createElement('div');
        editorDiv.className = 'editor';
        editorDiv.id = 'editor'+type+index;
        editorDiv.style.display = 'none';

    return editorDiv
}


/* Get the raw experiment code from the VWOData object.
 * Note that VWO uses different formats to store the code.
 */
function getRawExperimentCode(expData, index){
    var e = document.querySelector('.experiment'+index+' > select');
    var value = parseInt(e.options[e.selectedIndex].value);
    if(typeof(expData.sections[1].variations[value]) == 'string'){
        return expData.sections[1].variations[value];
    }
    else if(typeof(expData.sections[1].variations[value]) == 'object'){
        if(expData.sections[1].variations[value][0] == 'object'){
            return expData.sections[1].variations[value][0].js;
        }
    }
    return '';
}


/* Clean special characters from the code string. This function might need some
 * work. VWO does some weird stuff and it is difficult to determine which special
 * characters belong to the original code or are added by VWO.
 */
function cleanSpecialCodeChars(codeString){
    var temp = codeString;
    temp = temp.replace(/(\\n|\\t)/g, '');
    temp = temp.replace(/\\\//g, '/');
    temp = temp.replace(/\\"/g, '"');
    //https://stackoverflow.com/questions/5989315/regex-for-match-replacing-javascript-comments-both-multiline-and-inline
    temp = temp.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/g, '');

    return temp
}


/* Get the raw experiment code from the object and clean it. When this is done
 * place it in the corresponding Ace editor
 */
function addEditor(expData, index){
    var raw = getRawExperimentCode(expData, index);
    /*var globalJS = */
    var clean = new Promise((resolve, reject) => {
        var resultcodes = ["", ""] //for js, css and globalJS
        var tempJS;
        var tempCSS;
        var indexClosingTag;
        var callbackJS = false;
        var callbackCSS = false;
        var callbackDoneJS = false;
        var callbackDoneCSS = false;

        if(raw.indexOf('<script') == 0){ //clean layout
            indexClosingTag = raw.indexOf('</script>');
            if(indexClosingTag > -1){
                tempJS = raw.substring(raw.indexOf('>')+1, indexClosingTag);
                resultcodes[0] = tempJS;
            }
            //CSS
            indexClosingTag = raw.indexOf('</style>');
            if(indexClosingTag > -1){
                resultcodes[1] = raw.substring(raw.indexOf('style>')+6, indexClosingTag);
            }
        }
        else { //dirty shizzle
            indexClosingTag = raw.indexOf('<\\/script>');
            if(indexClosingTag > -1){
                callbackJS = true;
                tempJS = raw.substring(raw.indexOf('>')+1, indexClosingTag);
                tempJS = cleanSpecialCodeChars(tempJS)

                chrome.runtime.getBackgroundPage(function(eventPage){
                    eventPage.js_beautify_trigger(tempJS, {indent_size: 1, indent_char: '\t'}, prettyTextJS);
                })
                function prettyTextJS(text){
                    resultcodes[0] = text;
                    callbackDoneJS = true;
                }
            }
            //CSS
            indexClosingTag = raw.indexOf('<\\/style>');
            if(indexClosingTag > -1){
                callbackCSS = true;
                tempCSS = raw.substring(raw.indexOf('style>')+6, indexClosingTag);
                tempCSS = cleanSpecialCodeChars(tempCSS);

                chrome.runtime.getBackgroundPage(function(eventPage){
                    eventPage.beautifyCSS_trigger(tempCSS, prettyTextCSS);
                })
                function prettyTextCSS(text){
                    resultcodes[1] = text;
                    callbackDoneCSS = true;
                }
            }
        }

        if(!callbackJS && !callbackCSS) resolve(resultcodes);
        else {
            var total = 0;
            var delta = 100;
            var d = window.setInterval(function(){
                total += delta;
                if((callbackDoneJS && callbackDoneCSS) || total > 2000){
                    clearInterval(d);
                    resolve(resultcodes);
                }
            }, delta);
        }
    })

    clean.then((resultCodes) => {
        var editor = ace.edit('editorJS'+index);
            editor.setTheme('ace/theme/monokai');
            editor.getSession().setMode("ace/mode/javascript");
            editor.setReadOnly(true);
            editor.setValue(resultCodes[0]);
            // editor.setOption('wrap', 60);
            // editor.getSession().setUseWrapMode(true);
            editor.selection.moveCursorFileStart();

        var editor = ace.edit('editorCSS'+index);
            editor.setTheme('ace/theme/monokai');
            editor.getSession().setMode("ace/mode/css");
            editor.setReadOnly(true);
            editor.setValue(resultCodes[1]);
            // editor.setOption('wrap', 60);
            editor.selection.moveCursorFileStart();
    })
}


/* Called by initVWO.
 * Sets up html elements to add experiment information, if any.
 */
function add_experiments(experiments, campaignData){
    var i = 0;
    const expdiv = document.getElementsByClassName('experiments')[0];
    for(var key in experiments){
        if(experiments.hasOwnProperty(key) && campaignData != undefined && campaignData.hasOwnProperty(key)){
            i++;
            var exp = experiments[key];
            var campD = campaignData[key];
            var extraInfo = createExtraInfoElem(i);
            var editorDivJS = createEditorDiv(i, 'JS');
            var editorDivCSS = createEditorDiv(i, 'CSS');
            var goalsDiv = createGoalsDiv(exp, i);

            // var editorDivGlobal = createEditorDiv(i, 'JS');
            var x = document.createElement('div')
            x.className = 'experiment' + i;
            x.id = '_vis_opt_exp_'+key+'_combi';

            add_exp_type(x, exp);
            add_exp_name(x, exp);
            add_vars(x, exp, campD);
            expdiv.appendChild(extraInfo);
            expdiv.appendChild(editorDivJS);
            expdiv.appendChild(editorDivCSS);
            // expdiv.appendChild(editorDivGlobal);
            expdiv.appendChild(goalsDiv);
            expdiv.appendChild(x);
            addEditor(exp, i);
        }
        else if(experiments.hasOwnProperty(key) && campaignData == undefined){
            i++;
            var exp = experiments[key];
            var extraInfo = createExtraInfoElem(i);
            var editorDivJS = createEditorDiv(i, 'JS');
            var editorDivCSS = createEditorDiv(i, 'CSS');
            var goalsDiv = createGoalsDiv(exp, i);
            var x = document.createElement('div')
            x.className = 'experiment' + i;
            x.id = '_vis_opt_exp_'+key+'_combi';

            add_exp_type(x, exp);
            add_exp_name(x, exp);
            add_vars_no_camp_data(x, exp);
            expdiv.appendChild(extraInfo);
            expdiv.appendChild(editorDivJS);
            expdiv.appendChild(editorDivCSS);
            expdiv.appendChild(goalsDiv);
            expdiv.appendChild(x);
            addEditor(exp, i);
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

        //Add preventDefault button

        const prevDef = document.createElement('div');
            prevDef.className = 'prevDef';
            prevDef.innerHTML = '<span>Prevent Default </span>\
                            <label class="control-switch"> \
                            <input type="checkbox"> \
                            <div class="slider round"></div> \
                            </label>';

        mainInfo.parentNode.insertBefore(prevDef, mainInfo.nextSibling);

        const prevDefRadio = document.querySelector('.prevDef input');
        prevDefRadio.onclick = prevDefault;
        if(VWOData.CVPreventDefault){
            document.querySelector('.prevDef input').checked = true;
        }
        else {
            document.querySelector('.prevDef input').checked = false;
        }
        expdiv.setAttribute('style', 'max-height:250px;overflow-y:scroll');
    }

    document.querySelector('.experimentsElementText').innerText += ` (${i})`;
}


/* Function that is called when there is no VWO object on the page
 */
function notAvailable() {
    app.querySelector('.loading').remove();
    const notFound = document.createElement('div');
    notFound.className = 'VWONotFound'
          notFound.innerHTML = '<h1>VWO not found on this page</h1>';
    app.appendChild(notFound);
    // chrome.browserAction.setBadgeText({text:''+0+''})
}


/* On some pages there are issues with retrieving the VWO object, most likely due
 * to page reloads etc. This is a fallback
 */
function somethingWentWrong(){
    app.querySelector('.loading').remove();
    const somethingWentWrong = document.createElement('div');
    somethingWentWrong.className = 'VWONotFound'
          somethingWentWrong.innerHTML = '<h1>Something went wrong when retrieving the VWO object</h1>';
    app.appendChild(somethingWentWrong);
}


/* Function that is called when VWO is found but there are no experiments on the
 * page
 */
function noExperimentsData() {
    app.querySelector('.loading').remove();
    const mainInfo = document.createElement('div');
    mainInfo.className = 'mainInformation';
    app.appendChild(mainInfo);

    const mainInfoDiv = document.getElementsByClassName('mainInformation')[0];

    const header = document.createElement('div');
        header.innerHTML = '<h3> VWO is running on this page </h3>';
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
    noExp.innerHTML = '<h3> No active experiments </h3>';
    noExp.className = 'no-experiments';
    expdiv.appendChild(noExp);
}


/* Add the tracked goals header text and the garbagebin
 */
function add_events_header(eventsElement){
    var eventsHeader = document.createElement('P');
    var text = document.createTextNode("Goals fired on this page");
    eventsHeader.appendChild(text);
    eventsElement.appendChild(eventsHeader);

    const garbageBin = document.createElement('img');
    garbageBin.setAttribute('src', 'img/garbagebin.png');
    garbageBin.onclick = function() {
        document.getElementById('eventsBox').innerHTML = "";
        chrome.storage.local.get(null, function(items) {
            for(key in items){
                if(key != "key" && !key.includes('combi')){
                    splitKey = key.split('_');
                    if(document.getElementById('_vis_opt_exp_'+splitKey[0]+'_combi')){
                        removeGoalCookie(splitKey[0], splitKey[2]);
                    }
                }
            }
        });
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


/* Callback function on retrieving the VWO object
 */
let href;
let VWOData;
function initVWO(data){
    const app = document.getElementById('app');
    document.querySelector('#info > img').addEventListener('click', function(){
        toggleVisibility(document.getElementById('description'));
        toggleVisibility(document.getElementById('app'));
    });
    console.log(data);
    if((data !== null)){
        if (data === undefined || data.valid === 0)
          notAvailable();
        else if(data === null || data.valid === 2)
          noExperimentsData();
        else {
            href = data.curhref;
            app.querySelector('.loading').remove();
            VWOData = data;

            const mainInfo = document.createElement('div');
            mainInfo.className = 'mainInformation';
            app.appendChild(mainInfo);

            const mainInfoDiv = document.getElementsByClassName('mainInformation')[0];

            const header = document.createElement('div');
                header.innerHTML = '<h2> VWO is running on this page </h2>';
            header.className = 'header';

            const accID = VWOData.accID;
            const userID = VWOData.userID;
            const experiments = VWOData.experiments;
            const campaignData = VWOData.campaignData;

            const experimentsElement = document.createElement('div');
            experimentsElement.className = 'experiments';

            const eventsElement = document.createElement('div');
            eventsElement.id = 'events';

            var experimentsElementText = document.createElement('p');
                experimentsElementText.className = 'experimentsElementText';
                experimentsElementText.innerText = 'Active experiments';
                app.appendChild(experimentsElementText);

            app.appendChild(experimentsElement);
            app.appendChild(eventsElement);

            add_experiments(experiments, campaignData);

            add_events_header(eventsElement);
            add_events_box(app);
            checkGoals();
            var eventsBox = document.getElementById('eventsBox');
            if(eventsBox) eventsBox.innerHTML = '';
            window.setInterval(function(){
                appendGoals();
                setOnclicks();
            }, 1000);
        }
    } else {
        somethingWentWrong();
    }
}


/* On load get the VWOData and bind onclick on eventsHeader
 */
window.addEventListener('load', function(evt) {
    chrome.runtime.getBackgroundPage(function(eventPage){
        eventPage.queryContentScript(initVWO);
    });
    /* Clickvalue link click */
    document.getElementsByClassName('ClickValue-link-title')[0].addEventListener('click', function(){
        chrome.runtime.getBackgroundPage(function(eventPage){
            eventPage.openTab();
        })
    }, false);
});


/* Get the information belonging to a specific number and test number
 */
function getGoalInfo(testNum, goalNum){
    let goalData = VWOData.experiments;
    if(goalData[testNum] != undefined && goalData[testNum].goals[goalNum] != undefined){
        var type = goalData[testNum].goals[goalNum].type;
        return goalData[testNum].name + ' -- Goal: ' + goalNum + " -- " + type;
    };
    return '';
}


/* Check whether a goal is already listed in the fired goals list
 */
function alreadyListed(text){
    var elems = document.querySelectorAll('#eventsBox > div');
    for(var i = 0; i < elems.length; i++){
        if(elems[i].innerText.trim() == text.trim()) return true;
    }
    return false;
}


/* Bind the onclick on the fired goal elements to get more information
 */
function setOnclicks(){
    var elems = document.querySelectorAll('.infoElem');
    for(var i = 0; i < elems.length; i++){
	    elems[i].onclick = function(index1){
		    return function(){
            elems[index1].style.display = 'none'
            elems[index1].nextSibling.style.display = 'block';
    	    }
        }(i)
    }
    var hiddenElems = document.querySelectorAll('.hiddenInfoElem');

    for(var j = 0; j < hiddenElems.length; j++){
	    hiddenElems[j].onclick = function(index2){
		    return function(){
            hiddenElems[index2].style.display = 'none';
  			    hiddenElems[index2].previousSibling.style.display = 'block';
    	    }
        }(j)
    }
}


/* Add the extra info to a fired goal
 */
function appendGoalInfo(text, testNum, goalNum){
    var eventsBox = document.getElementById('eventsBox');
    eventsBox.innerHTML += '<div class="infoElem">'+text+'</div>';

    var hiddenInfo = document.createElement('div');
        hiddenInfo.style.display = 'none';
        hiddenInfo.className = "hiddenInfoElem";

    let goalData = VWOData.experiments;
    if(goalData[testNum] != undefined){
        var data = goalData[testNum].goals[goalNum]
        var tempElem;
        for(key in data){
            if(data[key] != ''){ // only append if it holds information
                tempElem = document.createElement('p')
                tempElem.innerHTML = key + " : " + data[key]
                hiddenInfo.appendChild(tempElem);
            }
        }
    }
    eventsBox.appendChild(hiddenInfo);
}


/* Append the currently fired goals for the current experiments
 */
function appendGoals(){
    var splitKey;
    chrome.storage.local.get(null, function(items) {
        for(key in items){
            if(key != "key" && !key.includes('combi')){
                splitKey = key.split('_');
                text = getGoalInfo(splitKey[0], splitKey[2]);
                if(text.length > 0 && !alreadyListed(text)){
                    appendGoalInfo(text, splitKey[0], splitKey[2]);
                }
            }
        }
    });
}


/* Append one newly fired goal
 */
function appendGoal(goal){
    var splitKey = key.split('_');
    var eventsBox = document.getElementById('eventsBox');
    if(eventsBox) eventsBox.innerHTML = '';
    text = getGoalInfo(splitKey[0], splitKey[2]);
    if(text.length > 0 && !alreadyListed(text)){
        eventsBox.innerHTML += '<span>'+text+'<span><br>';
    }
}


/* Add key value pair to storage. Update current key value if present.
 */
function setStorage(key, value, append){
    var storage = chrome.storage.local;
    var obj = {};
    obj[key] += value;
    storage.get(key, function (items){
        if(items.key != undefined) { // Or items["key1"] != undefined
           return;
        }
        else {
            storage.set(obj)
            if(append) appendGoal(key);
        }
    });
}


/* Check the cookies and add fired VWO goals the localstorage
 */
function checkGoals(){
    chrome.storage.local.clear();
    var key;
    var str;
    chrome.cookies.getAll({}, function(cookies) {
       for(var i = 0; i < cookies.length; i++){
            if(cookies[i].name.includes('_vis_opt_exp_') && cookies[i].name.includes('_goal_')){
                str = cookies[i].name;
                key = str.substring('_vis_opt_exp_'.length);
                setStorage(key, '_vis_opt_exp_', false);
            }
        }
    });
}
