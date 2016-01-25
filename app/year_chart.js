var dc = require("dc"),
  d3 = require('d3'),
  utils = require('./lib/utils'),
  sharedData = require('./shared_data');

module.exports = function(ndx) {
  var dim = ndx.dimension(dc.pluck('year'));
  var group = dim.group().reduceSum(
    function(d) {
      if (d.type === "Income") return d.val;
      else return -d.val;
    }
  );
  
  var chart = dc.barChart('#yearChart')
    .dimension(dim)
    .group(group)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .height(200)
    .width(utils.chartWidth)
    .margins({
      top: 10,
      right: 20,
      bottom: 30,
      left: 45
    })
    .elasticY(true)
    .title(function(d) {
      return d.key + ": " + sharedData.title(d.value);
    })
    .on('preRender.year', function(chart) {
      if (chart.filters().length === 0) {
        chart.filter(2014);
        chart.renderGroup();
      }
    })
    .on('postRender.year', function(chart) {
      setTimeout(function() {
        chart.selectAll('rect.bar').on('click.singleFiler', function(d, i) {
          chart.filterAll();
          chart.filter(d.data.key);
          dc.redrawAll();
        });
      }, 0);
    });
  chart._yAxisMax = chart.yAxisMax;
  chart.yAxisMax = function() {
    var yMax = this._yAxisMax();
    return Math.max(yMax, 0);
  };
  chart.yAxis().tickFormat(sharedData.axis).ticks(5);

  return chart;
};
