/*
 * (C) 2013 Gavin Lloyd <gavinhungry@gmail.com>
 * Regularish: a JavaScript regular expression editor
 */

yepnope([
  {
    test: window.JSON,
    nope: '//cdnjs.cloudflare.com/ajax/libs/json3/3.3.1/json3.min.js'
  }, {
    test: window.atob && window.btoa,
    nope: 'js/base64.min.js' // github.com/davidchambers/Base64.js
  },
  '//cdnjs.cloudflare.com/ajax/libs/jquery/1.11.0/jquery.min.js',
  '//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min.js',
  '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min.js',
  'js/slade.min.js'
]);
