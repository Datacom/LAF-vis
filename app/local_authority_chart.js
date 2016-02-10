// localAuthorityChart

var dc = require("dc"),
  d3 = require('d3'),
  utils = require('./lib/utils'),
  sharedData = require('./shared_data'),
  modularSeach = require('./lib/modular-search');
var cap = 24;
module.exports = function(ndx) {
  var oldFunc = 'if (extent[0] > 0) {\n extent[0] = 0;\n }';

  var rowChartCode = dc.rowChart.toString().replace(/ +/g,' ').replace(oldFunc, oldFunc+'\nif(extent[1]<0){\nextent[1]=0;\n}');
  var newRowChart = eval('('+rowChartCode+')');

  var dim = ndx.dimension(dc.pluck('council'));
  var group = dim.group().reduceSum(
    function(d) {
      if(d.type === "Income") return d.val;
      else return -d.val;
    }
  ).order(function(val) {
    return Math.abs(val);
  });
  var chart = newRowChart('#localAuthorityChart')
    .dimension(dim)
    .group(group)
    .height(599)
    .width(utils.chartWidth)
    .colors(d3.scale.category20())
    .margins({top: 5, left:10, right:10, bottom: 20})
    .data(function(group) {
        var data = group.all().reduce(function(obj, d) {
            obj[d.key] = d.value;
            return obj;
        },{});

        var currentTop = group.top(cap);//.map(dc.pluck('key'));
        var currentTopCouncils = group.top(cap).map(dc.pluck('key'));
        var currentFilters = chart.filters();

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
        //Append currrentTop unless already added or cap excedded to output
        currentTop.forEach(function(d){
            if(output.length<cap-2 && data[d.key]!==undefined) {
                output.push(d);
                delete data[d.key];
            }
        });

        output = output.sort(function(a,b) {return d3.descending(Math.abs(a.value),Math.abs(b.value));});
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
    .title(function(d) {return d.key+": "+sharedData.title(d.value);})
    .elasticX(true)
    .valueAccessor(function(d) {
      if(d.others) {
        var maxVal;
        d.fakeVal = false;
        switch(Math.sign(d.value)) {
          case -1:
            maxVal = chart.data().filter(function(d) {return d.value<0;})[0].value;
            if(maxVal > d.value) {
              d.fakeVal = true;
              return maxVal;
            }
            return d.value;
          case 1:
            maxVal = chart.data().filter(function(d) {return d.value>0;})[0].value;
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
    })
    .on('renderlet', function(chart) {
      // chart.root().selectAll('g.row').each(function(d, i) {
      //   // console.log(chart);
      //   var svgRect = this.parentNode.parentNode.getBoundingClientRect();
      //   var text = d3.select(this).select('text');
      //   var textRect = text.node().getBoundingClientRect();
      //   // chart.margins().right
      //   if(textRect.right > svgRect.right) {
      //     text.attr('x', svgRect.right - textRect.right - 10);
      //   } else {
      //     text.attr('x', 10);
      //   }
      // });
    })
    .on('pretransition', function(chart) {
      // chart.root().selectAll('g.row').each(function(d, i) {
      //   // console.log(chart);
      //   var svgRect = this.parentNode.parentNode.getBoundingClientRect();
      //   var duration = dc.disableTransitions ? 0 : chart.transitionDuration();
      //   d3.select(this).select('text').transition(duration).attr('x', function(d) {
      //     var textRect = this.getBoundingClientRect();
      //     if(textRect.right > svgRect.right) {
      //       return svgRect.right - textRect.right;
      //     } else {
      //       return 10;
      //     }
      //   });
      // });

      chart.root().selectAll('rect').style({
        mask: function(d) {
          var noFade = d.key !== "Others" || !d.fakeVal;
          if(noFade) return '';
          return (d.value<0)? "url(#negativeFade)" : "url(#positiveFade)";
        },
        stroke: function(d) {
            return (d.key === "Others")? 'black':'';
        }
      });

    });
  chart.cappedValueAccessor = function(d, i) {
    return chart.valueAccessor()(d, i);
  };
  chart.xAxis().ticks(5).tickFormat(sharedData.axis);

  modularSeach(chart);

  return chart;
};
