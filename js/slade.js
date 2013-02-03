(function($) {

  $.fn.sladeDown = function() {
    var content = $('> :first-child', this);
    if (content.length === 1) {
      var wHeight = this.outerHeight(true);
      var cHeight = content.outerHeight(true);
      var isClosed = cHeight > wHeight;

      this.css({ maxHeight: isClosed ? cHeight + wHeight + 2 : wHeight });
      content.css({ opacity: 1 });
    }
    return this;
  };

  $.fn.sladeUp = function() {
    var content = $('> :first-child', this);
    if (content.length === 1) {
      this.css({ maxHeight: 0 });
      content.css({ opacity: 0 });
    }
    return this;
  };

  $.fn.sladeToggle = function() {
    var content = $('> :first-child', this);
    if (content.length === 1) {
      var wHeight = this.outerHeight(true);
      var cHeight = content.outerHeight(true);
      var isClosed = cHeight > wHeight;

      this.css({ maxHeight: isClosed ? cHeight + wHeight + 2 : 0 });
      content.css({ opacity: isClosed ? 1 : 0 });
    }
    return this;
  };

})(jQuery);
