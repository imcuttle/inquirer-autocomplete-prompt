/* eslint-env mocha */

var expect = require('chai').expect;
var _sliceInput = require('../..').sliceInput;

function shouldCorrect(input, { leftIndex, matching, rightIndex }) {
  console.log(leftIndex, rightIndex, matching);
  expect(input.slice(0, leftIndex) + matching + input.slice(rightIndex)).to.eq(
    input
  );
}

function sliceInput(input, options = {}) {
  var rlt = _sliceInput(input, options);
  shouldCorrect(input, rlt);
  return rlt;
}

describe('sliceInput', function() {
  it('should slice input normally', function() {
    expect(sliceInput('closed #123', { cursor: 0 })).to.contains({
      leftIndex: 0,
      matching: 'closed',
      rightIndex: 6,
    });
  });

  it('should slice input unworks', function() {
    expect(sliceInput('closed #123')).to.contains({
      leftIndex: 11,
      matching: '',
      rightIndex: 11,
    });
  });

  it('should slice match left', function() {
    expect(sliceInput('closed #123', { cursor: 6 })).to.contains({
      leftIndex: 0,
      matching: 'closed',
      rightIndex: 6,
    });
  });

  it('should slice match right', function() {
    expect(sliceInput('closed #123', { cursor: 7 })).to.contains({
      leftIndex: 7,
      matching: '#123',
      rightIndex: 11,
    });
  });

  it('should slice match end', function() {
    expect(sliceInput('closed #123', { cursor: 11 })).to.contains({
      leftIndex: 7,
      matching: '#123',
      rightIndex: 11,
    });
  });

  it('should slice match overflow', function() {
    expect(sliceInput('closed #123', { cursor: 12 })).to.contains({
      leftIndex: 7,
      matching: '#123',
      rightIndex: 11,
    });
  });

  it('should slice match nothing', function() {
    expect(sliceInput('closed #123  #223', { cursor: 12 })).to.contains({
      leftIndex: 12,
      matching: '',
      rightIndex: 12,
    });
  });

  it('should delimiter be allowed', function() {
    expect(sliceInput('closed #123,#222', { delimiter: '\\s,', cursor: 7 })).to.contains({
      leftIndex: 7,
      matching: '#123',
      rightIndex: 11,
    });
  });
});
