var dc = require("dc"),
  sankeyChart = require("./lib/dc.sankey"),
  d3 = require('d3'),
  utils = require('./lib/utils'),
  sharedData = require('./shared_data');

module.exports = function(ndx) {
  var dim = ndx.dimension(dc.pluck('stream'));
  var group = dim.group().reduce(
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

  return sankeyChart('#moneyFlowChart').dimension(dim).group(group).data(function(group) {
      var nodes = [];
      var links = group.all().reduce(function(links, d) {
        var isIncome = sharedData.income.indexOf(d.key) !== -1;
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
    }).width(utils.chartWidth).height(695);
};
