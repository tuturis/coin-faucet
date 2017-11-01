function Captcha(){
    var self = this;
    this.api = {
      host:'api.coinhive.com',
      script:'https://authedmine.com/lib/captcha.min.js',
      verify:'/token/verify'
    };
  
    this.middleware = {
      render:function(req,res,next){
        req.captcha = self.render();
        next();
      },
      verify: function(req,res,next){
        self.verify(req,function(error, data){
          req.captcha = {error:error};
          if (data) {
            req.captcha.hostname =  data.hostname;
          }
          next();
        });
      }
    }
  };
  
  Captcha.prototype.init = function(site_key, secret_key, options){
    this.site_key = site_key;
    this.secret_key = secret_key;
    this.options = options || {};
    if (!this.site_key) throw new Error('site_key is required');
    if (!this.secret_key) throw new Error('secret_key is required');
  };
  
  Captcha.prototype.render = function(){
    var query_string = '';
    var captcha_attr = '';
    this.options = this.options || {};
    if (this.options.whitelabel) query_string += ' data-whitelabel='+this.options.whitelabel;
    if (this.options.callback) query_string += ' data-callback='+this.options.callback;
    if (this.options.disableElements) query_string += ' data-disable-elements='+this.options.disableElements;
    query_string = query_string.replace(/^&/,'?');

    var template = `<script src="${this.api.script}" async defer></script>
        <div class="coinhive-captcha" 
            data-key="${this.site_key}"
            data-hashes="${this.options.hashes}" ${captcha_attr}>
                <em>Loading Captcha...<br> 
                If it doesn't load, please disable Adblock!</em>
        </div>`;
    return template;
  };
  
  Captcha.prototype.verify = function(req, cb){
    var response = null;
    var post_options = null;
  
    if (!req) throw new Error('req is required');
    if(req.body && req.body['coinhive-captcha-token']) response = req.body['coinhive-captcha-token'];
    if(req.query && req.query['coinhive-captcha-token']) response = req.query['coinhive-captcha-token'];
  
    var query_string = `secret=${this.secret_key}&token=${response}&hashes=${this.options.hashes}`;

    post_options = {
      host: this.api.host,
      port: '443',
      path: this.api.verify,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(query_string)
      }
    };
  
    var request = https.request(post_options,function(res) {
      var body = '';
  
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function(){
        var result = JSON.parse(body);
        var error = result['error'] && result['error'].length > 0 ? result['error'][0] : 'invalid-input-response';
        if (result.success) {
          cb(null, {success: true});
        }
        else cb(error, null);
      });
      res.on('error', function(e) {
        cb(e.message, null);
      })
    });
    request.write(query_string);
    request.end();
  };
  
  module.exports = new Captcha();
  var https = require('https');
  