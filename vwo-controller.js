/* ClickValue Chrome VWO extension
 * Daan van Ingen
 *
 * vwo-controller.js handles the app layout and is responsible for handling
 * variations changes. Included by main.html
 */

var ACCOUNT_ID;
var HREF;
var DOMAIN;
var processed_experiments = 0;
var possible_experiments = 0;
var processed_experiment_goals = 0;
/*
 */
window.addEventListener('load', function(evt) {
  // chrome.runtime.getBackgroundPage(function(eventPage){
  //   eventPage.queryContentScript(initVWO);
  // });
  /* Clickvalue link click */
  document.getElementsByClassName('ClickValue-link-title')[0].addEventListener('click', function(){
    chrome.runtime.getBackgroundPage(function(eventPage){
      eventPage.openTab();
    })
  }, false);

  document.querySelector('#info > .help-btn').addEventListener('click', function(){
      toggleVisibility(document.getElementById('description'));
      toggleVisibility(document.getElementById('main-content'));
  });

  get_account_ID();
});


function toggleVisibility(elem){
    if(elem != undefined){
        if(elem.style.display == 'none') elem.style.display = 'block';
        else elem.style.display = 'none';
    }
}

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


function add_main_content(){
  let api_key = get_selected_api_key();

  vwo_api_call('GET', `https://app.vwo.com/api/v2/accounts/${ACCOUNT_ID}/campaigns`).then(function(response){
    let obj = JSON.parse(response);
    let active_exps = filter_active_exps(obj);

    let vwo_cookies = [];
    chrome.tabs.getSelected(null, function(tab){
      let urlObj = new URL(tab.url);
      HREF = urlObj.href;
      DOMAIN = urlObj.hostname.replace('www.', '');
      chrome.cookies.getAll({"domain": DOMAIN}, function(cookies) {
        for(let i = 0; i < cookies.length; i++){
          if(cookies[i].name.indexOf('_vis_opt_exp_') > -1){
            vwo_cookies.push(cookies[i]);
          }
        }
        set_up_experiments(active_exps, vwo_cookies);
      });
    });
    const prevDef = document.createElement('div');
    prevDef.className = 'prevDef';
    prevDef.innerHTML = '<span>Prevent Default </span>\
                    <label class="control-switch"> \
                    <input type="checkbox"> \
                    <div class="slider round"></div> \
                    </label>';

    document.querySelector('.goals-header').insertBefore(prevDef, document.querySelector('.garbage-bin'));

  })
  .catch(function(error){
    console.log(error);
    if(error.status === 403){
      let unauth = document.createElement('div');
        unauth.className = 'unauthorized';
        unauth.innerHTML = `<p>unauthorized request, make sure you have selected the right API key</p>`;
      document.querySelector('.experiments').appendChild(unauth);
    }
  })
}


function set_up_experiments(active_exps, vwo_cookies){
  if(active_exps.length > 0 && vwo_cookies.length > 0){
    document.querySelector('.goals-header').style.display = 'flex';
    document.querySelector('.experiments-header').style.display = 'flex';
    for(let i = 0; i < active_exps.length; i++){
      active_ID = active_exps[i].id;
      for(let j = 0; j < vwo_cookies.length; j++){
        if(vwo_cookies[j].name === `_vis_opt_exp_${active_ID}_combi`){
          possible_experiments += 1;
          create_experiment_item(active_exps[i]);
          add_goals(active_exps[i], vwo_cookies);
        }
      }
    }
  } else { // No active experiments
    update_loader_icon();
    let no_exp = document.createElement('div');
      no_exp.className = 'no-experiments';
      no_exp.innerHTML = '<p>VWO on page</p><p>No active experiments found</p>';
    document.querySelector('.experiments').appendChild(no_exp);
  }
}


function create_experiment_item(experiment){
  vwo_api_call('GET', `https://app.vwo.com/api/v2/accounts/${ACCOUNT_ID}/campaigns/${experiment.id}`).then(function(response){
    processed_experiments += 1;
    update_loader_icon();
    let cookie_name = `_vis_opt_exp_${experiment.id}_combi`;
    let new_expr = document.createElement('div');
      new_expr.className = 'experiment';
      new_expr.id = cookie_name;
      new_expr.innerHTML = `<div class="expr-title">${experiment.name}<div>`;

    let data = JSON.parse(response);
    data = data._data;

    let excluded_urls = check_urls(data.excludedUrls);
    if(excluded_urls.includes(true)) return;
    let included_urls = check_urls(data.urls);
    if(!included_urls.includes(true)) return;

    document.querySelector('.experiments').appendChild(new_expr);

    chrome.cookies.getAll({"domain" : DOMAIN, "name" : cookie_name}, function(cookie){
      let dropdown = document.createElement('select');
      dropdown.onchange = changeCookie;
      dropdown.className = 'variation_select';
      let variation;
      for(let i = 0; i < data.variations.length; i++){
        variation = data.variations[i]
        if(variation.id === parseInt(cookie[0].value)){
          dropdown.innerHTML += `<option value="${variation.id}" selected>${variation.name} (${variation.percentSplit}%)</option>`;
        }
        else {
          dropdown.innerHTML += `<option value="${variation.id}" >${variation.name} (${variation.percentSplit}%)</option>`;
        }
      }
      new_expr.appendChild(dropdown);
    });
  }, function(response){ // cant send too many calls to the api so need to throttle it
    if(document.querySelector(`#_vis_opt_exp_${experiment.id}_combi`) !== null || response.status === 409){
      update_loader_icon();
      return;
    }
    setTimeout(function(){
      create_experiment_item(experiment);
    }, 600);
  });
}


function add_listeners(){
  document.querySelector('.add-api-key-btn').addEventListener('click', function(e){
    chrome.storage.sync.get(['vwo-api-keys'], function(result){
      let value = document.querySelector('.add-api-key').value;
      if(value !== ""){
        if(Object.keys(result).length === 0 && result.constructor === Object){
          chrome.storage.sync.set({'vwo-api-keys': [value]});
        } else {
          let current_keys = result['vwo-api-keys'];
          if(!current_keys.includes(value)){
            current_keys.push(value);
            chrome.storage.sync.set({'vwo-api-keys': current_keys});
          }
        }
      }
    })
  });

  document.querySelector('.add-a-key').addEventListener('click', function(){
    toggle_visiblity(document.querySelector('.add-new-key'));
  })

  document.querySelector('.remove-a-key').addEventListener('click', function(){
    current_selected = get_selected_api_key();
    chrome.storage.sync.get(['vwo-api-keys'], function(result){
      if(Object.keys(result).length !== 0 && result.constructor === Object){
        let current_keys = result['vwo-api-keys'];
        let index = current_keys.indexOf(current_selected);
        if(index > -1) current_keys.splice(index, 1);
        chrome.storage.sync.set({'vwo-api-keys': current_keys}, function(){
          fill_api_keys_select();
        });
      }
    });
  });

  document.querySelector('.garbage-bin').addEventListener('click', function(){
    let goals = document.querySelectorAll('.goal');
    for(let i = 0; i < goals.length; i++){
      let expr_id = goals[i].getAttribute('expr_id');
      let goal_id = goals[i].getAttribute('goal_id');
      removeGoalCookie(expr_id, goal_id);
      goals[i].parentNode.removeChild(goals[i]);
    }
  })
}


function fill_api_keys_select(procceed=true){
  let api_select = document.querySelector('.api-key-select');
  api_select.innerHTML = "";
  chrome.storage.sync.get(['vwo-api-keys'], function(result){
    let stored_keys = result['vwo-api-keys'];
    for(let i = 0; i < stored_keys.length; i++){
      if(i == 0){
        api_select.innerHTML += `<option value=${i} selected>${stored_keys[i]}</option>`;
      } else {
        api_select.innerHTML += `<option value=${i}>${stored_keys[i]}</option>`;
      }
    }
    if(procceed) add_main_content();
  });
}


function toggle_visiblity(elem){
  if(elem.style.display === 'none') elem.style.display = 'block';
  else elem.style.display = 'none';
}


function vwo_api_call(method, url){
  return new Promise(function (resolve, reject) {
    let api_key = get_selected_api_key()
    var data = JSON.stringify(false);

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.onload = function(){
      if(this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      }
      else if(this.status === 429 || this.status === 403){
        reject({
          status: this.status
        });
      }
      else {
        reject({
          status: this.status,
        });
      }
    }

    xhr.open(method, url);

    xhr.setRequestHeader('token', api_key);

    xhr.send(data);
  });
}


function get_selected_api_key(){
  let select = document.querySelector('.api-key-select');
  let value;
  try {
    value = select.options[select.selectedIndex].innerText;
  }
  catch(error) {
    value = "";
  }
  finally {
    return value;
  }
}


function set_account_ID(data){
  if(data.is_vwo_page){
    ACCOUNT_ID = data.account_ID;
    add_listeners();
    fill_api_keys_select();
  }
  else {
    update_loader_icon();
    fill_api_keys_select(false);
    let no_vwo = document.createElement('div');
      no_vwo.className = 'no-vwo';
      no_vwo.innerHTML = '<p>VWO not found</p>';
    document.querySelector('.experiments').appendChild(no_vwo);
  }
}


function get_account_ID(){
  chrome.runtime.getBackgroundPage(function(eventPage){
    eventPage.queryContentScript(set_account_ID);
  });
}


function filter_active_exps(obj){
  let result = []
  let exps = obj._data;
  let num_exps = exps.length
  for(let i = 0; i < num_exps; i++){
    if(exps[i].status === "RUNNING"){
      result.push(exps[i]);
    }
  }

  return result
}


function check_urls(urls){
  let results = []
  let type;
  for(let i = 0; i < urls.length; i++){
    type = urls[i].type
    switch (type) {
      case "url":
        results.push(HREF === urls[i].value);
        break;
      case "pattern":
        let patterns = urls[i].value.split('*');
        let matches = true;
        for(let j = 0; j < patterns.length; j++){
          if(patterns[j] !== "" && HREF.indexOf(patterns[j]) === -1){
            matches = false;
            break;
          }
        }
        results.push(matches)
        break;
      case "contains":
        results.push(HREF.indexOf(urls[i].value) > -1);
        break;
      case "startsWith":
        results.push(HREF.indexOf(urls[i].value) === 0);
        break;
      case "endsWith":
        let total_length = HREF.length;
        let sub_length = urls[i].value.length;
        results.push(HREF.indexOf(urls[i].value) === total_length - sub_length - 1);
      case "regex":
        let regex = new RegExp(urls[i].value);
        results.push(regex.test(HREF));
      default:
        continue;
    }
  }

  return results;
}


function update_loader_icon(){
  if(processed_experiments >= possible_experiments){
    toggleVisibility(document.querySelector('.experiments .sk-folding-cube'));
  }
}

function update_loader_icon_goals(){
  if(processed_experiment_goals >= possible_experiments){
    toggleVisibility(document.querySelector('.goals .sk-folding-cube'));
    toggleVisibility(document.querySelector('.goals .garbage-bin'));
  }
}

function add_goals(experiment, vwo_cookies){
  vwo_api_call('GET', `https://app.vwo.com/api/v2/accounts/${ACCOUNT_ID}/campaigns/${experiment.id}/goals`).then(
    function(response){
      processed_experiment_goals += 1;
      update_loader_icon_goals();
      let data = JSON.parse(response);
      data = data._data;
      let fired_goals = [];
      for(let i = 0; i < vwo_cookies.length; i++){
        if(vwo_cookies[i].name.indexOf(`_vis_opt_exp_${experiment.id}_goal`) > -1){
          fired_goals.push(parseInt(vwo_cookies[i].name.replace(`_vis_opt_exp_${experiment.id}_goal_`, '')));
        }
      }
      for(let i = 0; i < data.length; i++){
        if(fired_goals.indexOf(data[i].id) > -1){
          create_fired_goals_elem(data[i], experiment.name, experiment.id);
        }
      }
    }, function(response) {
      setTimeout(function(){
        add_goals(experiment, vwo_cookies);
      }, 600);
    });
  // checkGoals();
  // var eventsBox = document.getElementById('eventsBox');
  // if(eventsBox) eventsBox.innerHTML = '';
  // window.setInterval(function(){
  //     appendGoals();
  //     setOnclicks();
  // }, 1000);
}


function create_fired_goals_elem(data, expr_name, expr_id){
  console.log(data, expr_name);
  let goal = document.createElement('div');
    goal.className = `goal`;
    goal.setAttribute('expr_id', expr_id);
    goal.setAttribute('goal_id', data.id);
    goal.innerHTML = `<div class="goal-title">${data.name}</div>
                      <div>${expr_name}</div>`;

  document.querySelector('#eventsBox').appendChild(goal);
}


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
