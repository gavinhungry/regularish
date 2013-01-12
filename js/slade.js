(function($) {

  $.fn.sladeDown = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift({ opacity: 'show', height: 'show' });
    $.fn.animate.apply(this, args);
    return this;
  };

  $.fn.sladeUp = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift({ opacity: 'hide', height: 'hide' });
    $.fn.animate.apply(this, args);
    return this;
  };

  $.fn.sladeToggle = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift({ opacity: 'toggle', height: 'toggle' });
    $.fn.animate.apply(this, args);
    return this;
  };

})(jQuery);
