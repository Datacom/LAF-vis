dc.sankeyChart = function(parent, chartGroup) {
  var _chart = dc.baseMixin({});

  var _sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10);
  var _path = _sankey.link();
  var _color = d3.scale.category20();
  var _format = d3.format('$,');

  _chart._doRedraw = function() {
    return this._doRender();
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

  function drawChart(data) {
    _sankey
      .size([_chart.width(), _chart.height()])
      .nodes(data.nodes)
      .links(data.links)
      .layout(32);

    var svg = _chart.svg();
    var groups = svg
      .selectAll('g')
      .data(d3.entries(data));
    groups.enter()
      .append('g')
      .attr('class', function(d) {
        return d.key;
      })
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
        })
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

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

    } else if (type === "link") {
      var link = g.selectAll(".link")
        .data(function(d) {
          return d.value;
        })
        .enter().append("path")
        .attr("class", "link")
        .attr("d", _path)
        .style("stroke-width", function(d) {
          return Math.max(1, d.dy);
        })
        .sort(function(a, b) {
          return b.dy - a.dy;
        });

      link.append("title")
        .text(function(d) {
          return d.source.name + " → " + d.target.name + "\n" + _format(d.value);
        });
    }
  }

  return _chart.anchor(parent, chartGroup);
};
