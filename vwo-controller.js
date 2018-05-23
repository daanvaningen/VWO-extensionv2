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
var CVPreventDefault;
// var date = new Date();
// var last_api_call_time = date.getTime();
// console.log(last_api_call_time);
/*
 */
window.addEventListener('load', function(evt) {
  // chrome.runtime.getBackgroundPage(function(eventPage){
  //   eventPage.queryContentScript(initVWO);
  // });
  /* Clickvalue link click */
  document.getElementsByClassName('ClickValue-link-title')[0].addEventListener('click', function(){
    chrome.runtime.getBackgroundPage(function(eventPage){
      eventPage.openCVTab();
    })
  }, false);

  document.getElementsByClassName('dev-token')[0].addEventListener('click', function(){
    chrome.runtime.getBackgroundPage(function(eventPage){
      eventPage.openDevTokenTab();
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
  if(api_key !== null && api_key !== undefined && api_key !== ""){
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
      const prevDefRadio = document.querySelector('.prevDef input');
      prevDefRadio.onclick = prevDefault;
      if(CVPreventDefault){
          document.querySelector('.prevDef input').checked = true;
      }
      else {
          document.querySelector('.prevDef input').checked = false;
      }

    })
    .catch(function(error){
      if(error.status === 403 || error.status === 401){
        let unauth = document.createElement('div');
          unauth.className = 'unauthorized';
          unauth.innerHTML = `<p>unauthorized request, make sure you have selected the right API token</p>`;
        document.querySelector('.experiments').appendChild(unauth);
      }
    })
  }
  else {
    let unauth = document.createElement('div');
      unauth.className = 'no-api-key';
      unauth.innerHTML = `<p>Please select or add an api token</p>`;
    document.querySelector('.experiments').appendChild(unauth);
  }
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
    document.querySelector('.experiments .experiments-wrapper').appendChild(no_exp);
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

    document.querySelector('.experiments .experiments-wrapper').appendChild(new_expr);

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
      let name = document.querySelector('.api-key-name').value;
      let combined = `(${name}) ${value}`;
      if(value !== ""){
        if(Object.keys(result).length === 0 && result.constructor === Object){
          chrome.storage.sync.set({'vwo-api-keys': [combined]});
        } else {
          let current_keys = result['vwo-api-keys'];
          if(!current_keys.includes(combined)){
            current_keys.push(combined);
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
    let select = document.querySelector('.api-key-select')
    current_selected = select.options[select.selectedIndex].innerText;
    chrome.storage.sync.get(['vwo-api-keys'], function(result){
      if(Object.keys(result).length !== 0 && result.constructor === Object){
        let current_keys = result['vwo-api-keys'];
        let index = current_keys.indexOf(current_selected);
        if(index > -1) current_keys.splice(index, 1);
        chrome.storage.sync.set({'vwo-api-keys': current_keys}, function(){
          console.log('wewewewewew');
          let succes_message = document.createElement('p');
            succes_message.className = 'succes-message';
            succes_message.innerText = 'Succesfully removed key';
            document.querySelector('.API-key').appendChild(succes_message);
          fill_api_keys_select(proceed=false);
        });
      }
    });
  });

  document.querySelector('.api-key-select').addEventListener('change', update_API_key_index);
}


function update_API_key_index(){
  let select = document.querySelector('.api-key-select');
  let index = select.selectedIndex;

  chrome.storage.sync.set({'vwo-api-key-index': index}, function() {
    console.log(index);
  });
}


function fill_api_keys_select(proceed=true){
  chrome.storage.sync.get('vwo-api-key-index', function(result) {
    console.log(result);
    let index = result['vwo-api-key-index'];
    if(index === undefined){ //First time
      index = 0;
      chrome.storage.sync.set({'vwo-api-key-index': index}, function() {
        console.log(index);
      });
    }
    let api_select = document.querySelector('.api-key-select');
    api_select.innerHTML = "";
    chrome.storage.sync.get(['vwo-api-keys'], function(result){
      let stored_keys = result['vwo-api-keys'];
      if(index >= stored_keys.length) index = 0;
      for(let i = 0; i < stored_keys.length; i++){
        if(i == index){
          api_select.innerHTML += `<option value=${i} selected>${stored_keys[i]}</option>`;
        } else {
          api_select.innerHTML += `<option value=${i}>${stored_keys[i]}</option>`;
        }
      }
      if(proceed) add_main_content();
    });
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
    return null;
  }
  finally {
    let sep = value.split(') ');
    return sep[1];
  }
}


function set_account_ID(data){
  CVPreventDefault = data.CVPreventDefault
  add_listeners();
  if(data.is_vwo_page){
    ACCOUNT_ID = data.account_ID;
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

    // Set garbage-bin click listener
    document.querySelector('.garbage-bin').addEventListener('click', function(){
      let goals = document.querySelectorAll('.goal');
      for(let i = 0; i < goals.length; i++){
        let expr_id = goals[i].getAttribute('expr_id');
        let goal_id = goals[i].getAttribute('goal_id');
        removeGoalCookie(expr_id, goal_id);
        goals[i].parentNode.removeChild(goals[i]);
      }
    });

    // Add click listeners for goal on click
    setOnclicks();
  }
}

function add_goals(experiment, vwo_cookies){
  vwo_api_call('GET', `https://app.vwo.com/api/v2/accounts/${ACCOUNT_ID}/campaigns/${experiment.id}/goals`).then(
    function(response){
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
      processed_experiment_goals += 1;
      update_loader_icon_goals();
    }, function(response) {
      setTimeout(function(){
        add_goals(experiment, vwo_cookies);
      }, 600);
    });
}


function create_fired_goals_elem(data, expr_name, expr_id){
  let goal = document.createElement('div');
    goal.className = `goal`;
    goal.setAttribute('expr_id', expr_id);
    goal.setAttribute('goal_id', data.id);
    goal.innerHTML = `<div class="goal-title">${data.name}</div>
                      <div style="font-size:12px">${expr_name}</div>`;

  document.querySelector('#eventsBox .goals-wrapper').appendChild(goal);

  let hiddenInfoElem = document.createElement('div');
    hiddenInfoElem.className = 'hiddenInfoElem';
    hiddenInfoElem.innerHTML = `<div class="hiddenInfoElem-header">
                                  <span>id: ${data.id}</span><span>type: ${data.type}
                                </div>`;

  if(data.urls !== undefined){
    let urls = document.createElement('div');
      urls.className = 'goal-urls';
      urls.innerHTML = `<p style="font-weight:bold">url(s):`;
      for(let i = 0; i < data.urls.length; i++){
        if(i > 0) urls.innerHTML += `,`;
        urls.innerHTML += `<div><span>value: ${data.urls[i].value}</span><span>type: ${data.urls[i].type}</span></div>`;
      }
    urls.innerHTML += `</p>`;
    hiddenInfoElem.appendChild(urls);
  }

  if(data.cssSelectors !== undefined){
    let cssSelectors = document.createElement('div');
      cssSelectors.className = 'cssSelectors';
      cssSelectors.innerHTML = `<p style="font-weight:bold">CSS selector(s):</p>`;
      for(let i = 0; i < data.cssSelectors.length; i++){
        if(i > 0) cssSelectors.innerHTML += `,`;
        cssSelectors.innerHTML += `<span>${data.cssSelectors[i]}</span>`;
      }
    hiddenInfoElem.appendChild(cssSelectors);
  }
  document.querySelector('#eventsBox .goals-wrapper').appendChild(hiddenInfoElem);
}

/* Bind the onclick on the fired goal elements to get more information
 */
function setOnclicks(){
    var elems = document.querySelectorAll('.goal');
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

function removeGoalCookie(expID, goalID){
    var cookieName = '_vis_opt_exp_' + expID + '_goal_' + goalID;
    var domain;
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
  if(!CVPreventDefault){
      CVPreventDefault = true;
      chrome.runtime.getBackgroundPage(function(eventPage){
          eventPage.prevDefault();
      })
  } else {
      resetCollapse();
  }
}
