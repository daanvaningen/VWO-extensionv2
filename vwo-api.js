var data = JSON.stringify(false);

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  } else {
    console.log("Nope");
  }
});

xhr.open("GET", "https://app.vwo.com/api/v2/accounts/current");

xhr.setRequestHeader('token', '5233871bff4fa59e63c412af8a28374a8fa54fc30a57853f34f22b70104d56cd');

xhr.send(data);
