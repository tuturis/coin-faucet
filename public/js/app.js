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
function CaptchaCallback(token) {
    console.log('callback fired ')
    if(localStorage.getItem('autoClaim')) {
        document.getElementById("claimForm").submit();
    }
}
function start() {
    if(localStorage.getItem('autoClaim')) {
        console.log('startcalled, autoclaim true')
        $('#verify-me').click();
        //$('#verify-me').click();        
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
        $('#autoCheckBox').prop('checked', true);
        $('#verify-me').click()
    } else {
        $('#autoCheckBox').prop('checked', true);
    }
});