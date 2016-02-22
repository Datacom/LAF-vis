module.exports = {
  chartWidth: function(root) {
    var width = root.getBoundingClientRect().width;
    var paddingLeft = Number(getComputedStyle(root).paddingLeft.slice(0,-2));
    var paddingRight = Number(getComputedStyle(root).paddingRight.slice(0,-2));
    return width-paddingLeft-paddingRight;
  }
};
