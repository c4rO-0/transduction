// injection technique borrowed from http://stackoverflow.com/questions/840240/injecting-jquery-into-a-page-fails-when-using-google-ajax-libraries-api

var script = document.createElement("script");
script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
script.onload = script.onreadystatechange = function () {
  $(document).ready(function () {
    $("body").append("<button id='asynchronous-messageBtn'> asynchronous </button>")
  });
};
document.body.appendChild(script);
