var dc = require('dc'),
  d3 = require('d3'),
  sankey = require('./sankey');

module.exports = function(parent, chartGroup) {
  var _chart = dc.marginMixin(dc.baseMixin({}));

  var _sankey = sankey()
    .nodeWidth(15)
    .nodePadding(10);
  var _path = _sankey.link();
  var _color = d3.scale.category20();
  var _format = d3.format('$,');

  _chart._doRedraw = function() {
    var data = _chart.data();
    drawChart(data);
    return _chart;
  };

  _chart._doRender = function() {
    _chart.resetSvg();
    var data = _chart.data();
    if (typeof data === "object" && data.hasOwnProperty('nodes') && data.hasOwnProperty('links') && Object.keys(data).length === 2) {
      //can draw chart
      drawChart(data);
    } else {
      throw new dc.errors.InvalidStateException('Data function on sankeyChart[#' + _chart.anchorName() + '] doesn\'t return correct format of data. eg. {nodes: [], links: []}');
    }
    return _chart;
  };

  _chart.sankey = function() {
    return _sankey;
  };

  function drawChart(data) {
    var m = _chart.margins();
    var width = _chart.width() - m.top - m.bottom;
    var height = _chart.height() - m.left - m.right;
    _sankey
      .size([width, height])
      .nodes(data.nodes)
      .links(data.links)
      .layout(32);

    var svg = _chart.svg();
    var groups = svg
      .selectAll('g.nodes, g.links')
      .data(d3.entries(data), function(d) {
        return d.key;
      });
    groups.enter()
      .append('g')
      .attr("transform", "translate(" + m.top + "," + m.left + ")")
      .attr('class', function(d) {
        return d.key;
      });

    groups.transition().duration(_chart.transitionDuration())
      .attr("transform", "translate(" + m.top + "," + m.left + ")");

    groups.exit()
      .remove();

    groups.each(populateGroup);
  }

  function populateGroup(data) {
    var type = data.key.slice(0, -1);
    var g = d3.select(this);
    if (type === "node") {
      var node = g.selectAll(".node")
        .data(function(d) {
          return d.value;
        }, function(d) {
          return d.name;
        });

      node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        }).each(function(d) {
          var node = d3.select(this);
          node.append("rect")
            .attr("height", function(d) {
              return d.dy;
            })
            .attr("width", _sankey.nodeWidth())
            .style("fill", function(d) {
              return d.color = _color(d.name.replace(/ .*/, ""));
            })
            .style("stroke", function(d) {
              return d3.rgb(d.color).darker(2);
            })
            .append("title")
            .text(function(d) {
              return d.name + "\n" + _format(d.value);
            });

          node.append("text")
            .attr("x", -6)
            .attr("y", function(d) {
              return d.dy / 2;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) {
              return d.name;
            })
            .filter(function(d) {
              return d.x < _chart.width() / 2;
            })
            .attr("x", 6 + _sankey.nodeWidth())
            .attr("text-anchor", "start");
        });

      node.classed({
        "hidden":function(d){return d.value === 0; }
      });

      node.transition().duration(_chart.transitionDuration())
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        }).each(function(d) {
          var rect = d3.select(this).select('rect');
          rect.transition().duration(_chart.transitionDuration())
            .attr("height", function(d) {
              return d.dy;
            }).attr("width", _sankey.nodeWidth());
          rect.select("title")
            .transition().duration(_chart.transitionDuration())
            .text(function(d) {
              return d.name + "\n" + _format(d.value);
            });
          var text = d3.select(this).select('text');
          text.transition().duration(_chart.transitionDuration())
            .attr("y", function(d) {
              return d.dy / 2;
            });
        });

      node.exit().remove();
    } else if (type === "link") {
      var link = g.selectAll(".link")
        .data(function(d) {
          return d.value;
        }, function(d) {
          return d.source.name + " -> " + d.target.name;
        });

      link.enter().append("path")
        .attr("class", "link")
        .attr("d", _path)
        .style({
          "stroke-width": function(d) {
            return Math.max(1, d.dy);
          }
        })
        .sort(function(a, b) {
          return b.dy - a.dy;
        }).append("title")
        .text(function(d) {
          return d.source.name + " → " + d.target.name + "\n" + _format(d.value);
        });

      link.classed({
        "hidden":function(d){return d.value === 0; }
      });

      link.transition().duration(_chart.transitionDuration())
        .attr("d", _path)
        .style("stroke-width", function(d) {
          return Math.max(1, d.dy);
        })
        .sort(function(a, b) {
          return b.dy - a.dy;
        });
      link.select("title").transition().duration(_chart.transitionDuration())
        .text(function(d) {
          return d.source.name + " → " + d.target.name + "\n" + _format(d.value);
        });


      link.exit().remove();
    }
  }

  return _chart.anchor(parent, chartGroup);
};
