var Awesomplete = require('awesomplete');

module.exports = function(chart) {
  var values = chart.group().all().map(function(d) {
    return d.key;
  });
  var input = chart.root().select('input');
  var awesomplete = new Awesomplete(input.node(), {
    minChars: 0
  });
  awesomplete.list = values;
  input.on('awesomplete-selectcomplete', function() {
    var val = input.node().value;
    if (values.indexOf(val) >= 0) {
      chart.filter(val).redrawGroup();
    }
    input.node().value = "";
  });

  var btn = chart.root().select('.dropdown-btn');

  btn.on("click.opendropdown", function() {
    if (awesomplete.ul.childNodes.length === 0) {
      awesomplete.minChars = 0;
      awesomplete.evaluate();
    } else if (awesomplete.ul.hasAttribute('hidden')) {
      awesomplete.open();
    } else {
      awesomplete.close();
    }
  });
};
