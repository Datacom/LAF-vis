var dc = require("dc"),
  d3 = require('d3'),
  utils = require('./lib/utils'),
  splitChart = require('./lib/split-chart'),
  sharedData = require('./shared_data');

module.exports = function(ndx) {
  var dim = ndx.dimension(dc.pluck('stream'));
  var group = dim.group().reduceSum(dc.pluck('val'));
  var charts = splitChart(dc.rowChart, [
    '#incomeChart',
    '#expenditureChart'
  ], function(d) {
    return (sharedData.income.indexOf(d.key) !== -1) ? 0 : 1;
  }, '#incomeExpenditureReset').options({
    dimension: dim,
    group: group,
    elasticX: true,
    height: 300,
    width: utils.chartWidth,
    title: function(d) {return d.key+": "+sharedData.title(d.value);}
  }).apply(function(chart) { chart.xAxis().tickFormat(sharedData.axis).ticks(5); });
  charts.setOnFiltered(true);
  console.log(true);
  return charts;
};
