var dc = require("dc"),
  d3 = require('d3'),
  utils = require('./lib/utils'),
  pyramidChart = require('./lib/pyramid-chart'),
  sharedData = require('./shared_data');

module.exports = function(ndx) {
  var dim = ndx.dimension(function(d) {
    return [d.type, d.activity];
  });
  var group = dim.group().reduceSum(dc.pluck('val'));

  var chart = dc.pyramidChart('#activityChart')
    .dimension(dim)
    .group(group)
    .elasticX(true)
    .colors(sharedData.activityScale)
    .leftColumn(function(d) {
      return d.key[0] == 'Income';
    })
    .rowAccessor(function(d) {
      return d.key[1];
    })
    .rowOrdering(d3.ascending)
    .colorAccessor(function(d) {
      return d.key[1];
    })
    .twoLabels(false)
    .columnLabels(['Income', 'Expenditure'])
    .height(300)
    .width(utils.chartWidth)
    .margins({top:5, left: 10, right: 10, bottom: 20})
    .title(function(d) {
      return d.key + ": " + sharedData.title(d.value);
    });
  chart.xAxis().tickFormat(sharedData.axis);

  return chart;
};
