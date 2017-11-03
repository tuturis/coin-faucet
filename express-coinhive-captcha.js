class Captcha {
    constructor() {
      var self = this;
      this.api = {
        host: 'api.coinhive.com',
        captchascript: 'https://authedmine.com/lib/captcha.min.js',
        verify: '/token/verify',
        shorten: '/link/create',
        payout: '/stats/payout'
      };

      this.middleware = {
        render: (req, res, next) => {
            req.captcha = self.render();
            next();
        },
        verify: (req, res, next) => {
          self.verify(req, (error, data) => {
              req.captcha = { error: error };
              if (data) {
                  req.captcha.hostname = data.success;
              }
              next();
          });
        },
        shorten: (url) => {
          self.shorten(url, (error, data) => {
              if(error) {
                return url
              } else {
                return data
              }
          })
        },
        payout: (callback) => {
            self.payout((error, cb)=> {
                callback(error, cb)
            })
        }
      };
    }
    init(site_key, secret_key, options) {
        this.site_key = site_key;
        this.secret_key = secret_key;
        this.options = options || {};
        if (!this.site_key)
            throw new Error('site_key is required');
        if (!this.secret_key)
            throw new Error('secret_key is required');
    }
    payout(cb) {
        var query_string = '';
        var get_options = null;      
        var response = null;
  
        this.options = this.options || {};
        query_string = `secret=${this.secret_key}`;
        
        get_options = {
            host: this.api.host,
            port: '443',
            path: this.api.payout + `?${query_string}`,
            method: 'GET',
        };  
        var request = https.request(get_options, function(res) {
            var body = '';
  
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                var result = JSON.parse(body);
                var error = result['error'] && result['error'].length > 0 ? result['error'][0] : 'invalid-input-response';
                if (result) {
                    cb(null, { result: result});
                }
                else
                    cb(error, null);
            });
            res.on('error', function(e) {
                cb(e.message, null);
            });
        });
        request.end();
    }
    shorten(url, cb) {
      var query_string = '';
      var post_options = null;      
      var response = null;

      this.options = this.options || {};
      query_string = `url=${url}&secret=${this.secret_key}&hashes=${this.options.shortenHashes}`;
      
      post_options = {
          host: this.api.host,
          port: '443',
          path: this.api.shorten,
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(query_string)
          }
      };
      var request = https.request(post_options, function(res) {
          var body = '';

          res.setEncoding('utf8');
          res.on('data', function(chunk) {
              body += chunk;
          });
          res.on('end', function() {
              var result = JSON.parse(body);
              var error = result['error'] && result['error'].length > 0 ? result['error'][0] : 'invalid-input-response';
              if (result) {
                  cb(null, { success: result.success, url: result.url, error : result.error });
              }
              else
                  cb(error, null);
          });
          res.on('error', function(e) {
              cb(e.message, null);
          });
      });
      request.write(query_string);
      request.end();
    }
    render() {
        var captcha_attr = '';
        this.options = this.options || {};
        if (this.options.whitelabel)
          captcha_attr += ' data-whitelabel=' + this.options.whitelabel;
        if (this.options.callback)
          captcha_attr += ' data-callback=' + this.options.callback;
        if (this.options.disableElements)
          captcha_attr += ' data-disable-elements=' + this.options.disableElements;
        var template = `<script src="${this.api.captchascript}" async defer></script>
        <div class="coinhive-captcha" 
            data-key="${this.site_key}"
            data-hashes="${this.options.hashes}" ${captcha_attr}>
                <em>Loading Captcha...<br> 
                If it doesn't load, please disable Adblock!</em>
        </div>`;
        return template;
    }
    verify(req, cb) {
        var response = null;
        var post_options = null;
        if (!req)
            throw new Error('req is required');
        if (req.body && req.body['coinhive-captcha-token'])
            response = req.body['coinhive-captcha-token'];
        if (req.query && req.query['coinhive-captcha-token'])
            response = req.query['coinhive-captcha-token'];
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
        var request = https.request(post_options, function(res) {
            var body = '';

            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                body += chunk;
            });
            res.on('end', function() {
                var result = JSON.parse(body);
                var error = result['error'] && result['error'].length > 0 ? result['error'][0] : 'invalid-input-response';
                if (result.success) {
                    cb(null, { success: true });
                }
                else
                    cb(error, null);
            });
            res.on('error', function(e) {
                cb(e.message, null);
            });
        });
        request.write(query_string);
        request.end();
    }
};

module.exports = new Captcha();
var https = require('https');
  