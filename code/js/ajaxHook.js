/* ClickValue Chrome VWO extension
 * Richard Bieringa
 * Daan van Ingen
 *
 *
 */

console.log('AjaxHook');
var hook = new AjaxHook();
var regex = new RegExp('.*');
hook.installHook(regex, function callback(xhr){
    console.log('callback');
    console.log(xhr);
});


function AjaxHook(){

	var hooks = {};
	var initTime = new Date().getTime();
	var self = this;

	var trim = function(strdata){
		strdata.replace(/\s+/,'');
	};

	var oldOpen = XMLHttpRequest.prototype.open;
	var oldSend = XMLHttpRequest.prototype.send;

	var convertStrToRegExp = function(str){
		var targetExpr = str.substring(1,str.length-1);
		return new RegExp(targetExpr);
	};

	var getHookCallbackForUrl = function(url){
		var iter = 0;
		var urlPats = Object.keys(hooks);
		for (iter=0;iter<urlPats.length;iter++){
			if (convertStrToRegExp(urlPats[iter]).test(url)){
				return hooks[urlPats[iter]];
			}
		};

	};

	var adaptAsRegEx = function(urlPat){
		return new RegExp("^(http(s)?:\/\/)?" + urlPat + "(.)*$"); //For impicit regexp expressions
	};


	XMLHttpRequest.prototype.open = function(){
        console.log('open');
		var currentUrl = arguments[1];
		var callback = getHookCallbackForUrl(currentUrl);
		if (callback){
			this[initTime] = {};
			this[initTime].callback = callback;
		}else if (this[initTime]){
			this.onreadystatechange = this[initTime].orgCallback;
			delete this[initTime];
		}
		oldOpen.apply(this, arguments);
	};


	XMLHttpRequest.prototype.send = function(){
        console.log('send');
		var xhrObj = this;
		if (this[initTime] && this[initTime].callback){
			this[initTime].orgCallback = this.onreadystatechange;
			var handler = function(){
				if (xhrObj[initTime].orgCallback){
					xhrObj[initTime].orgCallback.apply(xhrObj,Array.prototype.slice.apply(arguments));
				}
				xhrObj[initTime].callback.call(xhrObj, xhrObj);
			};
			this.onreadystatechange = handler;
		}
		oldSend.apply(this, arguments);

	};


	this.installHook = function(url, callback){
		var targetUrl = (url instanceof RegExp) ? url : adaptAsRegEx(url);
		hooks[targetUrl] = callback;
	};

	this.removeHook = function(url){
		var targetUrl = (url instanceof RegExp) ? url : adaptAsRegEx(url);
		delete hooks[targetUrl];
	};

	this.removeAllHooks = function(){
		hooks = {};
	};
};
