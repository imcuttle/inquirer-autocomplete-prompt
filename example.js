/**
 * List prompt example
 */

'use strict';
var inquirer = require('inquirer');
var _ = require('lodash');
var fuzzy = require('fuzzy');
var sliceInput = require('./index').sliceInput;

inquirer.registerPrompt('autocomplete', require('./index'));

var states = [
  'Alabama',
  'Alaska',
  'American Samoa',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District Of Columbia',
  'Federated States Of Micronesia',
  'Florida',
  'Georgia',
  'Guam',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Marshall Islands',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Northern Mariana Islands',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Palau',
  'Pennsylvania',
  'Puerto Rico',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virgin Islands',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

var foods = ['Apple', 'Orange', 'Banana', 'Kiwi', 'Lichi', 'Grapefruit'];

function searchStates(answers, input) {
  input = input || '';
  return new Promise(function(resolve) {
    setTimeout(function() {
      var fuzzyResult = fuzzy.filter(input, states);
      resolve(
        fuzzyResult.map(function(el) {
          return el.original;
        })
      );
    }, _.random(400, 500));
  });
}

function searchFood(answers, input) {
  input = input || '';
  return new Promise(function(resolve) {
    setTimeout(function() {
      var fuzzyResult = fuzzy.filter(input, foods);
      resolve(
        fuzzyResult.map(function(el) {
          return el.original;
        })
      );
    }, _.random(500, 800));
  });
}

inquirer
  .prompt([
    {
      type: 'autocomplete',
      noResultText: null,
      searchText: null,
      name: 'issues',
      suggestOnly: true,
      default: 'closed #123',
      message: 'What issues you want to close (e.g. close #123,#234)?\n',
      source: (answer, input = '', { cursor }) => {
        var { matching, leftIndex, rightIndex } = sliceInput(input, {
          cursor,
          delimiter: '\\s,',
        });
        var makeChoice = name => {
          var name = name + matching.slice(1);
          return {
            name,
            cursor: leftIndex + name.length,
            value: input.slice(0, leftIndex) + name + input.slice(rightIndex),
          };
        };

        if (matching.startsWith('#') && matching.length > 1) {
          return [
            makeChoice('issue-'),
            makeChoice('issue-a-'),
            makeChoice('issue-ab-'),
          ];
        }

        return [];
      },
      pageSize: 4,
      validate: function(val) {
        return val ? true : 'Type something!';
      },
    },
    {
      name: 'input',
      type: 'input',
      message: 'im input\n'
    },
    {
      type: 'confirm',
      name: 'confirm',
      default: false,
      message: 'Are you sure?'
    },
    {
      type: 'autocomplete',
      name: 'fruit',
      suggestOnly: true,
      message: 'What is your favorite fruit(error)?\n',
      source: (ans, ipt) => {
        if (ipt === 'error') {
          throw new Error('error!');
        }
        return [ipt];
      },
      pageSize: 4
    },
    {
      type: 'confirm',
      name: 'confirm',
      default: false,
      message: 'Are you sure?'
    },
    {
      type: 'autocomplete',
      name: 'fruit',
      when: ans => ans.confirm,
      suggestOnly: true,
      default: 'Orange',
      message: 'What is your favorite fruit?\n',
      source: searchFood,
      pageSize: 4,
      validate: function(val) {
        return val ? true : 'Type something!';
      },
    },
    {
      type: 'confirm',
      name: 'confirm2',
      default: false,
      message: 'Are you sure?'
    },
    {
      when: ans => ans.confirm2,
      type: 'autocomplete',
      name: 'state',
      default: 'Utah',
      message: 'Select a state to travel from\n',
      source: searchStates,
    },
    {
      type: 'autocomplete',
      name: 'state',
      message: 'Select a state to travel from (without default)\n',
      source: searchStates,
    },
    {
      type: 'autocomplete',
      name: 'fruit',
      suggestOnly: true,
      message: 'What is your favorite fruit(without default)?\n',
      source: searchFood,
      pageSize: 4,
      validate: function(val) {
        return val ? true : 'Type something!';
      },
    },
    {
      type: 'autocomplete',
      name: 'issues',
      suggestOnly: true,
      message: 'What issues you want to close (e.g. close #123,#234)?',
      source: (answer, input = '', { cursor }) => {
        var { matching, leftIndex, rightIndex } = sliceInput(input, {
          cursor,
          delimiter: '\\s,',
        });
        var makeChoice = name => {
          var name = name + matching.slice(1);
          return {
            name,
            value: input.slice(0, leftIndex) + name + input.slice(rightIndex),
          };
        };

        if (matching.startsWith('#') && matching.length > 1) {
          return [
            makeChoice('issue-'),
            makeChoice('issue-a-'),
            makeChoice('issue-ab-'),
          ];
        }

        return [];
      },
      pageSize: 4,
      validate: function(val) {
        return val ? true : 'Type something!';
      },
    },
  ])
  .then(function(answers) {
    console.log(JSON.stringify(answers, null, 2));
  })
  .catch(console.error);
