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
  ]
};
