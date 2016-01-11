var moneyTitle = d3.format('$,');
var moneyAxis = d3.format('$s');

d3
.csv('data/LAF_14-09.csv')
.row(function(d) {
  d.val = Number(d.val)*1000;
  d.year = Number(d.year);
  return d;
})
.get(function(error, data) {
  var ndx = new crossfilter(data);
  var charts = {};

  dataCount = dc.dataCount('#dataCount')
    .dimension(ndx)
    .group(ndx.groupAll())
    .html({
      some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
          ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
      all: 'All records selected. Please click on the graph to apply filters.'
    });

  var council_dim = ndx.dimension(dc.pluck('council'));
  var council_group = council_dim.group().reduceSum(dc.pluck('val'));
  charts.council = dc.rowChart('#councilChart')
    .dimension(council_dim)
    .group(council_group)
    .height(602.5)
    .cap(19)
    .colors(d3.scale.category20())
    .ordering(function(d) {return -d.value;})
    .title(function(d) {return d.key+": "+moneyTitle(d.value);})
    .elasticX(true)
    .valueAccessor(function(d) {
      if(d.others) {
        return council_group.top(1)[0].value + charts.council.x().invert(charts.council.margins().right/2);
      }
      return d.value;
    });
  charts.council.cappedValueAccessor = function(d, i) {
    if (d.others) {
      return council_group.top(1)[0].value;
    }
    return charts.council.valueAccessor()(d, i);
  };
  charts.council.xAxis().ticks(5).tickFormat(moneyAxis);

  var year_dim = ndx.dimension(dc.pluck('year'));
  var year_group = year_dim.group().reduceSum(dc.pluck('val'));
  charts.year = dc.barChart('#yearChart')
    .dimension(year_dim)
    .group(year_group)
    .x(d3.scale.ordinal())
    .xUnits(dc.units.ordinal)
    .height(200)
    .margins({top: 10, right: 20, bottom: 30, left: 45})
    .elasticY(true)
    .title(function(d) {return d.key+": "+moneyTitle(d.value);})
    .on('preRender.year', function(chart) {
      if(chart.filters().length===0) {
        chart.filter(2014);
        chart.renderGroup();
      }
    })
    .on('postRender.year', function(chart) {
      setTimeout(function() {
        chart.selectAll('rect.bar').on('click.singleFiler', function(d,i){
          chart.filterAll();
          chart.filter(d.data.key);
          dc.redrawAll();
        });
      }, 0);
    });
  charts.year._yAxisMax = charts.year.yAxisMax;
  charts.year.yAxisMax = function() {
    var yMax = this._yAxisMax();
    return Math.max(yMax, 0);
  };
  charts.year.yAxis().tickFormat(moneyAxis).ticks(5);

  var income_dim = ndx.dimension(dc.pluck('income'));
  var income_group = income_dim.group().reduceSum(dc.pluck('val'));
  charts.income = dc.rowChart('#incomeChart')
    .dimension(income_dim)
    .group(income_group)
    .elasticX(true)
    .height(400)
    .title(function(d) {return d.key+": "+moneyTitle(d.value);});
  charts.income.xAxis().tickFormat(moneyAxis);

  var activity_dim = ndx.dimension(dc.pluck('activity'));
  var activity_group = activity_dim.group().reduceSum(dc.pluck('val'));
  charts.activity = dc.rowChart('#activityChart')
    .dimension(activity_dim)
    .group(activity_group)
    .elasticX(true)
    .height(400)
    .title(function(d) {return d.key+": "+moneyTitle(d.value);});
  charts.activity.xAxis().tickFormat(moneyAxis);

  for(var key in charts) {
    var chart = charts[key];
    chart.width(function(root) {
      var width = root.getBoundingClientRect().width;
      var paddingLeft = Number(getComputedStyle(root).paddingLeft.slice(0,-2));
      var paddingRight = Number(getComputedStyle(root).paddingRight.slice(0,-2));
      return width-paddingLeft-paddingRight;
    });
  }

  dc.disableTransitions = true;
  dc.renderAll();
  dc.disableTransitions = false;
});
