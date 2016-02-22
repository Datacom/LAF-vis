var d3 = require('d3');

module.exports = {
  title: d3.format('$,'),
  axis: d3.format('$s'),
  income: [
    'Rates',
    'Regulatory income and petrol tax',
    'Current grants, subsidies, and donations income',
    'Interest income',
    'Dividend income',
    'Sales and other operating income'
  ],
  expenditure: [
    'Employee costs',
    'Depreciation and amortisation',
    'Current grants, subsidies, and donations expenditure',
    'Interest expenditure',
    'Purchases and other operating expenditure'
  ],
  incomeScale: d3.scale.ordinal().range([
    '#c7e9c0',
    '#a1d99b',
    '#74c476',
    '#41ab5d',
    '#238b45',
    '#005a32'
  ]),
  expenditureScale: d3.scale.ordinal().range([
    '#fcbba1',
    '#fc9272',
    '#fb6a4a',
    '#de2d26',
    '#a50f15'
  ]),
  activityScale: d3.scale.ordinal().range([
    "#BEEB91",
    "#E9B7D2",
    "#E4AC75",
    "#9BDDD3",
    "#C0BB99",
    "#E7ADA6",
    "#9EE6AF",
    "#D0D6D1",
    "#D4D37B",
    "#DDEAB3",
    "#9BCFE3",
    "#CAC5E8",
    "#E1BD68",
    "#9DC490",
    "#EDCDA4",
    "#83E2C7"
  ])
};
