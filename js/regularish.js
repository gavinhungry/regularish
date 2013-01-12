var Regularish = (function() {
  'use strict';

  return {

    /*
     *
     */
    App: Backbone.View.extend({
      el: 'body',

      initialize: function() {
        this.regex = new Regularish.Regex();
        new Regularish.RegexView({ model: this.regex });
      }
    }),

    /*
     *
     */
    Template: (function() {
      var templates = {};

      // return a template from cache or fetch from the server and defer                                  
      var load = function(id) {
        var template = templates[id] || $.get('templates/' + id + '.html');                                                              
        templates[id] = template;
        return template;
      };

      return {
        // load an array of templates into Template, returns nothing                                      
        preload: function(id) {
          _.each(id, load);
        },

        // pass a template to a callback function                            
        get: function(id, callback) {
          var template = load(id);
          template.done(function(template) {
            callback(template);
          });
        }
      };
    })(), 

    /*
     *
     */
    Regex: Backbone.Model.extend({
      defaults: {
        pattern: '',
        flags: '',
        string: ''
      },
      
      // watch for changes to the properties applied to the RegExp object
      initialize: function() {
        this.on('change:pattern', this.updateRegex);
        this.on('change:flags', this.updateRegex);
        
        this.updateRegex();
      },
      
      // update the underlying RegExp object, track any error messages
      updateRegex: function() {
        try {
          this.unset('re');
          this.unset('error');
          this.set('re', new RegExp(this.get('pattern'), this.get('flags')));
        } catch(e) {
          this.set('error', e);
        }
      }
    }),

    /*
     *
     */
    RegexView: Backbone.View.extend({
      el: '#regex',
      
      initialize: function() {
        this.render();
        this.model.on('change', this.updateView, this);
      },

      // update the Regex Model when the input changes
      events: {
        'keyup #pattern': 'updateModel',
        'keyup #flags':   'updateModel',
        'keyup #string':  'updateModel'
      },
      
      updateModel: function() {
        this.model.set('pattern', this.$pattern.val());
        this.model.set('flags',   this.$flags.val());
        this.model.set('string',  this.$string.val());
      },

      // update the View when the Regex Model changes
      updateView: function() {
        var regex = this.model.attributes;
        
        this.$pattern.val(regex.pattern);
        this.$flags.val(regex.flags);
        this.$string.val(regex.string);
        this.$error.val(regex.error);
        
        // only show the error box if there is an error
        regex.error === undefined ?
          this.$wrap.sladeUp('fast') :
          this.$wrap.sladeDown('fast');
        
        var strings = (regex.string).split('\n');
        
        var results = this.regexMatch();
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
            if (matchStr.length > 0) { mOutput += '<span>' + matchStr + '</span>'; }
            string = string.slice(match.to);
          }
          
          mOutput += _.escape(string) + '<br>';
        }

        this.$matches.html(mOutput === '<br>' ? '' : mOutput);
        
        Regularish.Template.get('groups', function(template) {
          var gOutput = _.template(template, { groups: groups });
          this.$groups.html(gOutput === '\n' ? '' : gOutput);
        }.bind(this));
      },
      
      regexMatch: function() {
        var regex = this.model.attributes;
        var matches = [];
        var groups = [];
       
        if (regex.re instanceof RegExp) {
        
          // work on the input line-by-line
          var strings = (regex.string).split('\n');
          var result;
          
          for (var i = 0; i < strings.length; i++) {
            var string = strings[i];
            
            // matches for just this line
            var match = [];
            var group = [];

            while (result = regex.re.exec(string)) {
              var from = result.index;
              var to = from + result[0].length;

              match.push({ from: from, to: to });
              if ((regex.re.global || group.length === 0) && result.length > 0) {
                group.push(_.filter(_.rest(result, 1), function(s) {
                  return s.length > 0;
                }));
              }
              
              if (to === 0) { break; }
              string = string.substr(to);
              regex.re.lastIndex = 0;
            }
            
            // save matches and groups, reset lastIndex for next line
            matches.push(match);
            _.each(group, function(g) {
              if (!_.isEmpty(g)) { groups.push(g); }
            });
            regex.re.lastIndex = 0;
          }
        }
        
        return { matches: matches, groups: groups };
      },
      
      render: function() {
        this.$pattern = this.$('#pattern');
        this.$flags   = this.$('#flags');
        this.$string  = this.$('#string');
        this.$wrap    = this.$('#wrap');
        this.$error   = this.$('#error');
        this.$matches = this.$('#matches');
        this.$groups  = this.$('#groups');
        
        this.updateView();
      }
    })
  };
})();

$(function() {
  Regularish.Template.preload(['groups']);
  new Regularish.App();
  
  $('#pattern').trigger('focus');
  
  // Regex Quick Reference
  $('#tab').on('click', function() {
    $('#reference').stop().animate({ opacity: 'toggle' }, 'fast');
    $('#drawer').stop().animate({ height: 'toggle' }, 'fast');
  });
});
