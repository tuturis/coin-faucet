var truncate = function (fullStr, strLen, separator) {
    if (fullStr.length <= strLen) return fullStr;
    
    separator = separator || '...';
    
    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);
    
    return fullStr.substr(0, frontChars) + 
           separator + 
           fullStr.substr(fullStr.length - backChars);
};

var tStr = document.getElementsByClassName('tstr');
var i;
for (i = 0; i < tStr.length; i++) {
    tStr[i].innerHTML = truncate(tStr[i].innerHTML, 18);
} 
function myCaptchaCallback(token) {
    console.log('callback fired')
    document.getElementById("claimForm").submit();
}
function start() {
    if(localStorage.getItem('autoClaim')) {
        document.getElementById('verify-me').click();        
    }
}
$(function() {
    start()
    if(localStorage.getItem('address')){
        $(".address").val(localStorage.getItem('address'))
    }
    $(".address" ).change(function() {
        localStorage.setItem('address', $(".address").val())
      });
    $('#autoCheckBox').on('click', function(){
        if($('#autoCheckBox').is(":checked")) {
            localStorage.setItem('autoClaim', true)
            start()
        } else {
            localStorage.setItem('autoClaim', false)
        }
    })
    if(localStorage.getItem('autoClaim')) {
        $('#verify-me').click()
    }
});