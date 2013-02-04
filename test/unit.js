// global instance window.regularish is provided by test/index.html
test('global instance of App', function() {
  ok(regularish, 'global instance of Regularish.App exists (test only)');
});


// decode base64 permalink route to JSON strings represending regex objects
test('App.getRegex returns valid regex from route', function() {
  var regex = regularish.getRegex('eyJwIjoiKGdhdmluKS5sbG95ZCIsImYiOiJpIiwicyI6IkdhdmluJTIwTGxveWQifQ==');
  deepEqual(regex, {
    pattern: '(gavin).lloyd', flags: 'i', string: 'Gavin Lloyd'
  }, '/(gavin).lloyd/i route returns correct regex');

  var regex = regularish.getRegex('eyJwIjoiIiwiZiI6ImciLCJzIjoiIn0=');
  deepEqual(regex, {
    pattern: '', flags: 'g', string: ''
  }, 'empty pattern and string returns correct regex');

  var regex = regularish.getRegex('this_is_not_a_valid_route');
  deepEqual(regex, {
    pattern: '(\\/) (o,,o) (\\/)',
    flags: '',
    string: 'Need a regular expressionz? Why not Zoidberg?\n/ o,,o /'
  }, 'invalid route returns the Zoidberg regex');
});


// stringify regex objects as JSON and encode to base64 for permalink route
test('App.getRoute returns valid route from regex', function() {
  var route = regularish.getRoute(new Regularish.Regex({
    pattern: '', flags: '', string: ''
  }));
  equal(route, '',
    'Empty regex returns correct route (an empty route)');

  var route = regularish.getRoute(new Regularish.Regex({
    pattern: '^[a-z]{5}[0-9]{4}_', flags: 'i', string: 'Gavin1234_'
  }));
  equal(route, 'eyJwIjoiJTVFJTVCYS16JTVEJTdCNSU3RCU1QjAtOSU1RCU3QjQlN0RfIiwiZiI6ImkiLCJzIjoiR2F2aW4xMjM0XyJ9',
    '/^[a-z]{5}[0-9]{4}_/i with string "Gavin1234_" returns correct route');

  var route = regularish.getRoute(new Regularish.Regex({
    pattern: 'Gavin', flags: 'g', string: 'Lloyd'
  }));
  equal(route, 'eyJwIjoiR2F2aW4iLCJmIjoiZyIsInMiOiJMbG95ZCJ9',
    '/Gavin/g with string "Lloyd" returns correct route');
});


test('Regex.updateRegex sets correct RegExp object', function() {
  var regex = new Regularish.Regex();
  deepEqual(regex.get('re'), new RegExp(),
    'empty RegExp is produced correcly from empty Regex');

  var regex = new Regularish.Regex({ pattern: '^[a-z][0-6]{4}_', flags: 'i' });
  deepEqual(regex.get('re'), /^[a-z][0-6]{4}_/i,
    'RegExp /^[a-z][0-6]{4}_/i is produced correctly');

  ok(regex.get('error') === undefined,
    'error object is unset correctly when RegExp is valid');

  // invalid Regex
  var regex = new Regularish.Regex({ pattern: '^[a-z]$', flags: 'x' });
  deepEqual(regex.get('re'), undefined,
    'invalid flag correctly unsets RegExp, result is undefined');

  ok(regex.get('error') instanceof Error,
    'error object is set correctly when RegExp is undefined');
});
