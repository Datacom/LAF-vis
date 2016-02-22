var dc = require('dc'),
    d3 = require('d3'),
    _ = require('underscore');

module.exports = function(chartType, anchors, dataInWhichChart, reset_id) {
  function filter_other_charts(chart) {
    var filters = chart.filters();
    charts.forEach(function(chart) {
      chart.on('filtered.filter_other_charts');
      //Select values that are only in 1 of the 2 arrays
      _(filters).difference(chart.filters()).concat(
        _(chart.filters()).difference(filters)
      ).forEach(function(filter) {
        chart.filter(filter);
      });
      chart.on('filtered.filter_other_charts', filter_other_charts);
    });
    hasFilters = filters.length !== 0;
    if(reset_id !== undefined) d3.selectAll(reset_id).classed("hidden", !hasFilters);
    dc.redrawAll();
  }

  var filter = true;
  var charts = anchors.map(function(anchor, index) {
    var chart = chartType(anchor).data(function(group) {
      var data = group.all();
      filteredData = data.filter(function(d) {
        return dataInWhichChart(d)==index;
      });
      return filteredData.sort(function(a,b) {return chart.ordering()(a)-chart.ordering()(b);});
    });
    return chart;
  });

  if(reset_id !== undefined) d3.selectAll(reset_id).on('click',function() {charts[0].filterAll();});

  var dim;
  charts.options = function(options) {
    dim = options.dimension;
    this.forEach(function(chart) {
      chart.options(options);
    });
    return this;
  };
  charts.apply = function(chartFunc) {
    this.forEach(chartFunc);
    return this;
  };
  charts.setOnFiltered = function(bool) {
    this.forEach(function(chart) {
      chart.on('filtered.filter_other_charts', bool? filter_other_charts : undefined);
    });
    hasFilters = charts[0].filters().length !== 0;
    if(reset_id !== undefined) d3.selectAll(reset_id).classed("hidden", !hasFilters);
  };

  if(reset_id === undefined) {
    charts.apply(function(chart) {
      var _chart = chart;
      chart.root().select('.reset').on('click', function() {
        var filters = _chart.filters();
        _chart.data().map(_chart.keyAccessor()).forEach(function(key) {
          if(filters.indexOf(key) !== -1) _chart.filter(key);
        });
        _chart.redrawGroup();
      });
      // chart.filters()
      // chart.filter()
    });
  }
  return charts;
};
