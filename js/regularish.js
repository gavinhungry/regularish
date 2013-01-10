'use strict';

var Regularish = {};

Regularish.App = Backbone.View.extend({
  el: 'body',

  initialize: function() {
    this.regex = new Regularish.Regex();
    new Regularish.RegexView({ model: this.regex });
  }
});



Regularish.Regex = Backbone.Model.extend({
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
});



Regularish.RegexView = Backbone.View.extend({
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
    
    var strings = (regex.string).split('\n');
    var output = '';
    
    var matches = this.regexMatches();
    for (var i = 0; i < matches.length; i++) {
      var lineMatches = matches[i];
      var string = strings[i];

      // look for matches line-by-line
      for (var j = 0; j < lineMatches.length; j++) {
        var match = lineMatches[j];
        output += string.slice(0, match.index);
        output += '<span>' + string.slice(match.index, match.offset) + '</span>';
        string = string.slice(match.offset);
      }
      
      output += string + '<br>';
    }
    
    $('#output').html(output);
    this.regexGroups();
    
  },
  
  regexMatches: function() {
    var regex = this.model.attributes;
    var matches = [];
   
    if (regex.re instanceof RegExp) {
      var strings = (regex.string).split('\n');
      var result;
      
      for (var i = 0; i < strings.length; i++) {
        var string = strings[i];
        var results = [];
      
        while (result = regex.re.exec(string)) {
          var index  = result.index;
          var offset = index + result[0].length;
          results.push({ index: index, offset: offset });

          if (offset === 0) { break; }
          string = string.substr(offset);
        }
        
        matches.push(results);
      }
    }
    
    return matches;
  },
  
  regexGroups: function() {
    var regex = this.model.attributes;
    var groups = [];
    
    var strings = (regex.string).split('\n');
    
    for (var i = 0; i < strings.length; i++) {
      var string = strings[i];
      groups.push(string.match(regex.re));
    }
    
    return groups;
  },
  
  wrapResults: function(results) {
  
  },
  
  render: function() {
    this.$pattern = this.$('#pattern');
    this.$flags   = this.$('#flags');
    this.$string  = this.$('#string');
    this.$error   = this.$('#error');
    
    this.updateView();
  }

});
