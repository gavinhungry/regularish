/*
 * Regularish: a JavaScript regular expression editor
 * (C) 2013 Gavin Lloyd <gavinhungry@gmail.com>
 */

var Regularish = (function() {
  'use strict';

  return {

    // Regularish.App
    App: Backbone.View.extend({
      el: 'body',

      initialize: function() {
        // focus the main input element
        this.$('#pattern').trigger('focus');

        // Regex Quick Reference
        this.$('#tab').on('click', _.bind(function() {
          this.$('#drawer').sladeToggle();
        }, this));

        // create Regex model, we'll only need one
        this.regex = new Regularish.Regex();

        this.router = new Regularish.Router();
        this.router.on('route:load', this.updateRegex, this);
        this.regex.on('change:pattern change:flags change:string',
          this.updateRoute, this);

        this.render();
        Backbone.history.start();
      },

      // gets RegExp object for route
      getRegex: function(route) {
        var regex;

        try {
          var json = atob(route);
          var options = JSON.parse(json);
          
          regex = {
            pattern: decodeURI(options.p),
            flags:   decodeURI(options.f),
            string:  decodeURI(options.s)
          };
        } catch(e) {
          regex = {
            pattern: '(\\/) (o,,o) (\\/)',
            flags: '',
            string: 'Need a regular expression? Why not Zoidberg?\n/ o,,o /'
          }        
        } finally {
          return regex;
        }
      },

      // update Regex when route changes
      updateRegex: function(route) {
        var regex = this.getRegex(route);
        this.regex.set(regex);

        this.regex.trigger('update');
      },

      getRoute: function(regex) {
        var options = {
          p: encodeURI(regex.get('pattern')),
          f: encodeURI(regex.get('flags')),
          s: encodeURI(regex.get('string'))
        };

        // all fields empty, there is no route
        if (!options.p && !options.f && !options.s) { return ''; }

        var json  = JSON.stringify(options);
        var route = btoa(json);

        return route;
      },

      // update route when Regex changes
      updateRoute: function() {
        var route = this.getRoute(this.regex);

        if (!route) {
          this.router.navigate('', { replace: true });
          return;
        }

        this.router.navigate('perm/' + route, { replace: true });
      },

      render: function() {
        new Regularish.RegexView({ model: this.regex });
      }
    }),


    // Regularish.Router
    Router: Backbone.Router.extend({
      routes: { 'perm/*splat': 'load' },
    }),


    // Regularish.Template
    Template: (function() {
      var templates = {};

      // return a template from cache or fetch from the server and defer
      var load = function(id) {
        var template = templates[id] || $.get('/templates/' + id + '.html');
        templates[id] = template;
        return template;
      };

      return {
        // load an array of templates into Template, returns nothing
        preload: function(id) {
          _.each(id, load);
        },

        // pass a template to a callback function
        get: function(id, callback, context) {
          var template = load(id);
          template.done(function(template) {
            callback.call(context, template);
          });
        }
      };
    })(),


    // Regularish.Regex
    Regex: Backbone.Model.extend({
      defaults: {
        pattern: '',
        flags: '',
        string: ''
      },

      // watch for changes to the properties applied to the RegExp object
      initialize: function() {
        this.on('change:pattern change:flags', this.updateRegex);
        this.updateRegex();
      },

      // update the underlying RegExp object, track any error messages
      updateRegex: function() {
        this.unset('re');
        this.unset('error');

        try {
          this.set('re', new RegExp(this.get('pattern'), this.get('flags')));
        } catch(e) {
          this.set('error', e);
        }
      },

      getMatches: function() {
        var regex = this.attributes;
        var re = regex.re;

        var matches = [];
        var groups = [];

        if (re instanceof RegExp) {

          // work on the input line-by-line
          var strings = (regex.string).split('\n');
          var result;

          for (var i = 0; i < strings.length; i++) {
            var string = strings[i];

            // matches for just this line
            var match = [];
            var group = [];

            while (result = re.exec(string)) {
              var from = result.index;
              var to = from + result[0].length;

              match.push({ from: from, to: to });
              if ((re.global || group.length === 0) && result.length > 0) {
                group.push(_.filter(_.rest(result, 1), function(s) {
                  return s !== undefined && s.length > 0;
                }));
              }

              if (to === 0) { break; }
              string = string.substr(to);
              re.lastIndex = 0;
            }

            // save matches and groups
            matches.push(match);
            _.each(group, function(g) {
              if (!_.isEmpty(g)) { groups.push(g); }
            });

            // reset lastIndex for next line
            re.lastIndex = 0;
          }
        }

        return { matches: matches, groups: groups };
      }
    }),


    // Regularish.RegexView
    RegexView: Backbone.View.extend({
      el: '#regex',

      initialize: function() {
        var that = this;

        this.render();
        this.model.on('update', this.updateFields, this);
        this.model.on('change', this.updateView, this);

        // update the Regex Model when the input changes
        this.$('#pattern, #flags, #string').each(function() {
          var input = $(this);

          // use only the event that gets here first
          input.on('input keyup', function() {
            var value = input.val();
            if (input.data('cached') !== value) {
              input.data('cached', value);
              that.updateModel();
            }
          });
        });
      },

      updateModel: function() {
        this.model.set({
          pattern: this.$pattern.val(),
          flags: this.$flags.val(),
          string: this.$string.val()
        });
      },

      updateFields: function() {
        var regex = this.model.attributes;

        this.$pattern.val(regex.pattern);
        this.$flags.val(regex.flags);
        this.$string.val(regex.string);
      },

      // update the View when the Regex Model changes
      updateView: function() {
        var regex = this.model.attributes;

        // only show the error box if there is an error
        if (regex.error === undefined) {
          this.$notice.sladeUp(function() {
            this.$error.val(regex.error);
          });
        } else {
          this.$error.val(regex.error);
          this.$notice.sladeDown();
        }

        var strings = (regex.string).split('\n');

        var results = this.model.getMatches();
        var matches = results.matches;
        var groups  = results.groups;

        var mOutput = '';
        for (var i = 0; i < matches.length; i++) {
          var lineMatches = matches[i];
          var string = strings[i];

          // look for matches line-by-line
          for (var j = 0; j < lineMatches.length; j++) {
            var match = lineMatches[j];
            mOutput += _.escape(string.slice(0, match.from));
            var matchStr = _.escape(string.slice(match.from, match.to));
            if (matchStr.length > 0) {
              mOutput += '<span>' + matchStr + '</span>';
            }
            string = string.slice(match.to);
          }

          mOutput += _.escape(string) + '<br>';
        }

        (mOutput.length === 0 || mOutput === '<br>') ?
          this.$matches.hide().html('') :
          this.$matches.html(mOutput).show();

        Regularish.Template.get('groups', function(template) {
          var gOutput = _.template(template, { groups: groups });

          (gOutput.length === 0 || gOutput === '\n') ?
            this.$groups.hide().html('') :
            this.$groups.html(gOutput).show();
        }, this);
      },

      render: function() {
        this.$pattern = this.$('#pattern');
        this.$flags   = this.$('#flags');
        this.$string  = this.$('#string');
        this.$notice  = this.$('#notice');
        this.$error   = this.$('#error');
        this.$matches = this.$('#matches');
        this.$groups  = this.$('#groups');

        this.updateView();
      }
    })
  };
})();
