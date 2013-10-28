/*
 * (C) 2013 Gavin Lloyd <gavinhungry@gmail.com>
 * Regularish: a JavaScript regular expression editor
 */

yepnope([
  {
    test: window.JSON,
    nope: '//cdnjs.cloudflare.com/ajax/libs/json3/3.2.5/json3.min.js'
  }, {
    test: window.atob && window.btoa,
    nope: '/js/base64.min.js' // github.com/davidchambers/Base64.js
  },
  '//cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.js',
  '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.5.2/underscore-min.js',
  '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.0/backbone-min.js',
  '/js/slade.min.js'
]);
