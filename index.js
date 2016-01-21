var moneyTitle = d3.format('$,');
var moneyAxis = d3.format('$s');
var filterCouncilsFunc;

var oldString = "            if (extent[0] > 0) {\n                extent[0] = 0;\n            }";
var fixedRowChart = dc.rowChart.toString().replace(oldString,oldString+"if(extent[1]<0) {extent[1]=0;}");
dc.rowChart = eval('('+fixedRowChart+")");

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
  _data = data.filter(function(d) {return d.type !== "Other";});
  var ndx = new crossfilter(_data);
  charts = {};

/*******************************************************************************HEADER*/
  dc.dataCount('#resetAll').options({
    dimension: ndx,
    group: ndx.groupAll(),
    html: {
      some: '<a class="btn btn-primary" href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
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
  ).order(function(val) {
    return Math.abs(val);
  });;
  charts.council = dc.rowChart('#councilChart')
    .dimension(council_dim)
    .group(council_group)
    .height(500)
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
            if(output.length<17 && data[d.key]!==undefined) {
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
        var maxVal;
        d.fakeVal = false;
        switch(Math.sign(d.value)) {
          case -1:
            maxVal = charts.council.data().filter(function(d) {return d.value<0;})[0].value;
            if(maxVal > d.value) {
              d.fakeVal = true;
              return maxVal;
            }
            return d.value;
          case 1:
            maxVal = charts.council.data().filter(function(d) {return d.value>0;})[0].value;
            if(maxVal < d.value) {
              d.fakeVal = true;
              return maxVal;
            }
            return d.value;
          default: //shouldn't get here
            return 0;
        }
      }
      return d.value;
    }).on('pretransition', function(chart) {
      chart.root().selectAll('rect').style({
        mask: function(d) {
          var noFade = d.key !== "Others" || !d.fakeVal;
          if(noFade) return '';
          return (d.value<0)? "url(#negativeFade)" : "url(#posiveFade)";
        },
        stroke: function(d) {
            return (d.key === "Others")? 'black':'';
        }
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


  (function() {
    var sankeyDim = ndx.dimension(dc.pluck('stream'));
    var sankeyGroup = sankeyDim.group().reduce(
      function(p,v) {
        p[v.activity] = (p[v.activity] || 0) + v.val;
        return p;
      },
      function(p,v) {
        p[v.activity] -= v.val;
        return p;
      },
      function() {
        return {};
      }
    );
    testChart = dc.sankeyChart('#test').dimension(sankeyDim).group(sankeyGroup).data(function(group) {
      var nodes = [];
      var links = group.all().reduce(function(links, d) {
        var isIncome = income.indexOf(d.key) !== -1;
        for(var activity in d.value) {
          if(d.value !== 0) {
            if(nodes.indexOf(activity) === -1) nodes.push(activity);
            if(nodes.indexOf(d.key) === -1) nodes.push(d.key);
            var activityNode = nodes.indexOf(activity);
            var streamNode = nodes.indexOf(d.key);
            if(isIncome) links.push({source: streamNode, target: activityNode, value: d.value[activity]});
            else  links.push({source: activityNode, target: streamNode, value: d.value[activity]});
          }
        }
        return links;
      }, []);
      return {
        nodes: nodes.map(function(d) {return {name: d};}),
        links: links
      };
    }).width(function(c) {
      return chartWidthFunc(c) - 5;
    }).height(700);
  })();

  var chartWidthFunc = function(root) {
    var width = root.getBoundingClientRect().width;
    var paddingLeft = Number(getComputedStyle(root).paddingLeft.slice(0,-2));
    var paddingRight = Number(getComputedStyle(root).paddingRight.slice(0,-2));
    return width-paddingLeft-paddingRight;
  };

  window.onresize = function() {
    for(var key in charts) {
      var chart = charts[key];
      if(Array.isArray(chart)) {
        chart.apply(function(chart) {
          chart.width(chartWidthFunc);
        });
      } else {
        chart.width(chartWidthFunc);
      }
    }
    dc.renderAll();
  };


  dc.disableTransitions = true;
  window.onresize();
  dc.disableTransitions = false;


  // var sankey = d3.sankey()
  //   .size([width, height])
  //   .nodeWidth(15)
  //   .nodePadding(10)
  //   .nodes(nodes)
  //   .links(links)
  //   .layout(32);
  // var path = sankey.link();


});
