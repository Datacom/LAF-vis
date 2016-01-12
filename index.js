var moneyTitle = d3.format('$,');
var moneyAxis = d3.format('$s');
var filterCouncilsFunc;

var income = [
  'Rates',
  'Regulatory income and petrol tax',
  'Current grants, subsidies, and donations income',
  'Interest income',
  'Dividend income',
  'Sales and other operating income'
];
var expenditure = [
  'Employee costs',
  'Depreciation and amortisation',
  'Current grants, subsidies, and donations expenditure',
  'Interest expenditure',
  'Purchases and other operating expenditure'
];

d3
.csv('data/LAF_14-09.csv')//year,council,income,activity,val
.row(function(d) {
  d.val = Number(d.val)*1000;
  d.year = Number(d.year);

  d.stream = d.income; //stream of income/expenditure
  delete d.income;

  d.type = "Other";
  if(income.indexOf(d.stream) !== -1) d.type="Income";
  else if(expenditure.indexOf(d.stream) !== -1) d.type="Expenditure";

  return d;
})
.get(function(error, data) {
  var ndx = new crossfilter(data.filter(function(d) {return d.type !== "Other";}));
  charts = {};
/*******************************************************************************HEADER*/
  dc.dataCount('#dataCount').options({
    dimension: ndx,
    group: ndx.groupAll(),
    html: {
      some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
          ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
      all: 'All records selected. Please click on the graph to apply filters.'
    }
  });

/*******************************************************************************COUNCIL CHART*/
  var council_dim = ndx.dimension(dc.pluck('council'));
  var council_group = council_dim.group().reduceSum(
    function(d) {
      if(d.type === "Income") return d.val;
      else return -d.val;
    }
  );
  charts.council = dc.rowChart('#councilChart')
    .dimension(council_dim)
    .group(council_group)
    .height(600)
    .colors(d3.scale.category20())
    .data(function(group) {
        var data = group.all().reduce(function(obj, d) {
            obj[d.key] = d.value;
            return obj;
        },{});

        var currentTop = group.top(19);//.map(dc.pluck('key'));
        var currentTopCouncils = group.top(19).map(dc.pluck('key'));
        var currentFilters = charts.council.filters();

        var output = [];
        // Map current filters to data row
        currentFilters.forEach(function(council){
            output.push({key: council, value: data[council]});
            delete data[council];
        });

        output.sort(function(a, b){
            return b.value - a.value;
        });
        //Order curent filters
        //Append to output
        //Append currrentTop unless already added or 19 excedded to output

        currentTop.forEach(function(d){
            if(output.length<19 && data[d.key]) {
                output.push(d);
                delete data[d.key];
            }
        });
        // data = data.filter(function(d) {return currentTopCouncils.indexOf(d.key)===-1;});
        if(Object.keys(data).length > 0) {
          output.push({
              key: 'Others',
              value: Object.keys(data).reduce(function(prev, key) {return prev+data[key];}, 0),
              others: Object.keys(data)
          });
        }

        return output;
    })
    // .ordering(function(d) {
    //     // if(charts.council.filters().indexOf(d.key) >= 0){
    //     //     return -d.value -99999999999999;
    //     // }
    //     return d.value;
    // })
    .title(function(d) {return d.key+": "+moneyTitle(d.value);})
    .elasticX(true)
    .valueAccessor(function(d) {
      if(d.others) {
        if(d.value<0) {
          var min = d3.min(charts.council.data().slice(0,-1),dc.pluck('value'));
          if(min < 0) return min;
          else return d.value/25;
        }
        else return council_group.top(1)[0].value + charts.council.x().invert(charts.council.margins().right/2);
      }
      return d.value;
    }).on('pretransition', function(chart) {
      chart.root().selectAll('rect').filter(
        function(d) {
          return d.key==="Others";}
      ).style({
        mask: function(d) {
            return (d.value<0)? "url(#negativeFade)" : "url(#posiveFade)";
        },
        stroke: 'black'
      });
    });
  charts.council.cappedValueAccessor = function(d, i) {
    return charts.council.valueAccessor()(d, i);
  };
  charts.council.xAxis().ticks(5).tickFormat(moneyAxis);

  /*****************************************************************************COUNCIL BLOODHOUND SEARCH*/
  // var countryVals = country_dim.group().all().map(function(d) {return d.key;});
  var councilNames = council_dim.group().all().map(function(d) {return d.key;});



councilsSearch = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,

    local: councilNames
});

$('#bloodhound .typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 2
},
{
    name: 'councilsSearch',
    source: councilsSearch
}).on('keyup', this, function (event) {
    if (event.keyCode == 13) {
        filterCouncilsFunc();
    }

});

filterCouncilsFunc = function filterCouncils(){
    var val = $('#bloodhound .tt-input').val();
    if (councilNames.indexOf(val) >= 0){
        charts.council.filter(val).redrawGroup();
    }
    $('.typeahead').typeahead('val', '');
};


/********************************************************************************YEAR CHART*/
  var year_dim = ndx.dimension(dc.pluck('year'));
  var year_group = year_dim.group().reduceSum(
    function(d) {
      if(d.type === "Income") return d.val;
      else return -d.val;
    }
  );
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


/*******************************************************************************INCOME*/
  var income_expenditure_dim = ndx.dimension(dc.pluck('stream'));
  var income_expenditure_group = income_expenditure_dim.group().reduceSum(dc.pluck('val'));
  charts.income_expenditure = splitRowChart([
    '#incomeChart',
    '#expendiutreChart'
  ], function(d) {
    return (income.indexOf(d.key) !== -1) ? 0 : 1;
  }, '#incomeExpenditureReset').options({
    dimension: income_expenditure_dim,
    group: income_expenditure_group,
    elasticX: true,
    height: 200,
    title: function(d) {return d.key+": "+moneyTitle(d.value);}
  }).apply(function(chart) { chart.xAxis().tickFormat(moneyAxis).ticks(5); });

/*******************************************************************************ACTIVITY CHART*/
  var activity_dim = ndx.dimension(function(d) {
    return [d.type, d.activity];
  });
  var activity_group = activity_dim.group().reduceSum(dc.pluck('val'));
  charts.activity = dc.pyramidChart('#activityChart')
    .dimension(activity_dim)
    .group(activity_group)
    .elasticX(true)
    .leftColumn(function(d){return d.key[0] == 'Income';})
    .rowAccessor(function(d){return d.key[1];})
    .rowOrdering(d3.ascending)
    .colorAccessor(function(d) {return d.key[1];})
    .twoLabels(false)
    .columnLabels(['Income','Expenditure'])
    .height(400)
    .title(function(d) {return d.key+": "+moneyTitle(d.value);});
  charts.activity.xAxis().tickFormat(moneyAxis);

  for(var key in charts) {
    var chart = charts[key];
    if(Array.isArray(chart)) {
      chart.apply(function(chart) {
        chart.width(function(root) {
          var width = root.getBoundingClientRect().width;
          var paddingLeft = Number(getComputedStyle(root).paddingLeft.slice(0,-2));
          var paddingRight = Number(getComputedStyle(root).paddingRight.slice(0,-2));
          return width-paddingLeft-paddingRight;
        });
      });
    } else {
      chart.width(function(root) {
        var width = root.getBoundingClientRect().width;
        var paddingLeft = Number(getComputedStyle(root).paddingLeft.slice(0,-2));
        var paddingRight = Number(getComputedStyle(root).paddingRight.slice(0,-2));
        return width-paddingLeft-paddingRight;
      });
    }
  }

  dc.disableTransitions = true;
  dc.renderAll();
  dc.disableTransitions = false;

});
