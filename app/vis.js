var d3 = require('d3'),
    crossfilter = require('crossfilter'),
    dc = require('dc'),
    sharedData = require('./shared_data'),
    charts = [
      require("./activity_chart"),
      require("./money_flow_chart"),
      require("./local_authority_chart"),
      require("./year_chart"),
      require("./income_expenditure_charts")
    ];

module.exports = d3.csv('./data/LAF_14-09.csv')
.row(function(d) {
  d.val = Number(d.val)*1000;
  d.year = Number(d.year);

  d.stream = d.income; //stream of income/expenditure
  delete d.income;

  d.type = "Other";
  if(sharedData.income.indexOf(d.stream) !== -1) d.type="Income";
  else if(sharedData.expenditure.indexOf(d.stream) !== -1) d.type="Expenditure";

  return d;
}).get(function(error, data) {
  // console.log(error, data);

  var ndx = crossfilter(data.filter(function(d) {return d.type !== "Other";}));

  dc.dataCount('#resetAll').options({
    dimension: ndx,
    group: ndx.groupAll(),
    html: {
      some: '<a class="btn" href=\'javascript:dc.filterAll(); dc.renderAll();\'\'><i class="fa fa-undo"></i> Reset All</a>',
      all: ''
    }
  }).on('pretransition', function(chart) {
    var filters = dc.chartRegistry.list().map(function(chart) {return chart.filters();}).reduce(function(prev, cur) {return prev.concat(cur);});
    chart.root().select('a').on('click', function() {
      dc.filterAll();
      dc.renderAll();
    }).classed('hidden', (filters.length === 1 && filters[0] === 2014));
  });

  charts.forEach(function(chart, idx) {
    chart(ndx);
  });

  dc.disableTransitions = true;
  dc.renderAll();
  dc.disableTransitions = false;
});
