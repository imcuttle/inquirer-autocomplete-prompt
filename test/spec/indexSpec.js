/* eslint-env mocha */

var expect = require('chai').expect;
var sinon = require('sinon');
var inquirer = require('inquirer');
var ReadlineStub = require('../helpers/readline');
var Prompt = require('../../index');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('inquirer-autocomplete-prompt', function() {
  var source;
  var prompt;
  var resolve;
  var promise;
  var rl;
  var defaultChoices;
  var promiseForAnswer;

  describe('suggestOnly = true', function() {
    beforeEach(function() {
      defaultChoices = ['foo', new inquirer.Separator(), 'bar', 'bum'];
      promise = new Promise(function(res) {
        resolve = res;
      });
      source = sinon.stub().returns(promise);

      rl = new ReadlineStub();
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          suggestOnly: true,
          source: source,
        },
        rl
      );
    });

    it('default value with suggestOnly = true', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          default: '123',
          suggestOnly: true,
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();
      expect(prompt.rl.line).to.equal('');
      expect(prompt.rl.cursor).to.equal(undefined);
      enter();

      return promiseForAnswer.then(function(answer) {
        expect(answer).to.equal('123');
      });
    });

    it('default value with suggestOnly = false', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          default: 'foo',
          suggestOnly: false,
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();

      expect(prompt.rl.line).to.equal('foo');
      expect(prompt.rl.cursor).to.equal('foo'.length);

      resolve(defaultChoices);
      return promise.then(() => {
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('foo');
        });
      });
    });

    it('render error when `source` thrown error', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          // default: 'foo',
          suggestOnly: false,
          source: (anw, ipt) => {
            if ('error' === ipt) throw new Error('sourceError');
            return [ipt];
          },
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();

      resolve(defaultChoices);
      return promise.then(() => {
        type('2222');
        enter(prompt.rl.line);
        return delay(100).then(() => {
          promiseForAnswer.then(function(answer) {
            expect(answer).to.equal('foo');
          });
        });
      });
    });

    it('applies filter', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          filter: function(val) {
            return val.slice(0, 2);
          },
          suggestOnly: true,
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();
      type('banana');
      enter();

      return promiseForAnswer.then(function(answer) {
        expect(answer).to.equal('ba');
      });
    });

    it('applies filter async with done callback', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          filter: function(val) {
            var done = this.async();
            setTimeout(function() {
              done(null, val.slice(0, 2));
            }, 100);
          },
          suggestOnly: true,
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();

      type('banana');
      enter();

      return promiseForAnswer.then(function(answer) {
        expect(answer).to.equal('ba');
      });
    });

    it('applies filter async with promise', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          filter: function(val) {
            return new Promise(function(resolve) {
              resolve(val.slice(0, 2));
            });
          },
          suggestOnly: true,
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();

      type('banana');
      enter();

      return promiseForAnswer.then(function(answer) {
        expect(answer).to.equal('ba');
      });
    });

    describe('when tab pressed', function() {
      var promiseForAnswer;
      beforeEach(function() {
        promiseForAnswer = getPromiseForAnswer();
        resolve(defaultChoices);
        return promise;
      });

      it('autocompletes the value selected in the list', function() {
        tab();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('foo');
        });
      });

      it('accepts any input', function() {
        type('banana');
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('banana');
        });
      });
    });
  });

  describe('suggestOnly = false', function() {
    beforeEach(function() {
      defaultChoices = ['foo', new inquirer.Separator(), 'bar', 'bum'];
      promise = new Promise(function(res) {
        resolve = res;
      });
      source = sinon.stub().returns(promise);

      rl = new ReadlineStub();
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          source: source,
        },
        rl
      );
    });

    it('applies filter', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          filter: function(val) {
            return val.slice(0, 2);
          },
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();
      resolve(defaultChoices);

      return promise.then(function() {
        moveDown();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('ba');
        });
      });
    });

    it('applies filter async with done calback', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          filter: function(val) {
            var done = this.async();
            setTimeout(function() {
              done(null, val.slice(0, 2));
            }, 100);
          },
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();
      resolve(defaultChoices);

      return promise.then(function() {
        moveDown();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('ba');
        });
      });
    });

    it('applies filter async with promise', function() {
      prompt = new Prompt(
        {
          message: 'test',
          name: 'name',
          filter: function(val) {
            return new Promise(function(resolve) {
              resolve(val.slice(0, 2));
            });
          },
          source: source,
        },
        rl
      );

      promiseForAnswer = getPromiseForAnswer();
      resolve(defaultChoices);

      return promise.then(function() {
        moveDown();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('ba');
        });
      });
    });

    it('requires a name', function() {
      expect(function() {
        new Prompt({
          message: 'foo',
          source: source,
        });
      }).to.throw(/name/);
    });

    it('requires a source parameter', function() {
      expect(function() {
        new Prompt({
          name: 'foo',
          message: 'foo',
        });
      }).to.throw(/source/);
    });

    it('immediately calls source with undefined', function() {
      prompt.run();
      sinon.assert.calledOnce(source);
      sinon.assert.calledWithExactly(source, undefined, '', prompt.rl);
    });

    describe('when it has some results', function() {
      var promiseForAnswer;
      beforeEach(function() {
        promiseForAnswer = getPromiseForAnswer();
        resolve(defaultChoices);
        return promise;
      });

      it('should move selected cursor on keypress', function() {
        moveDown();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('bar');
        });
      });

      it('moves up and down', function() {
        moveDown();
        moveDown();
        moveUp();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('bar');
        });
      });

      it('loops choices going down', function() {
        moveDown();
        moveDown();
        moveDown();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('foo');
        });
      });

      it('loops choices going up', function() {
        moveUp();
        enter();

        return promiseForAnswer.then(function(answer) {
          expect(answer).to.equal('bum');
        });
      });
    });

    describe('searching', function() {
      beforeEach(function() {
        prompt.run();
        source.reset();
        source.returns(promise);
      });

      it('searches after each char when user types', function(done) {
        type('a');
        type('bba');
        sinon.assert.notCalled(source);
        setTimeout(() => {
          sinon.assert.calledWithExactly(source, undefined, 'abba', prompt.rl);
          done();
        }, 1000);
      });

      it('does not search again if same searchterm (not input added)', function(done) {
        type('ice');
        sinon.assert.notCalled(source);
        setTimeout(() => {
          sinon.assert.calledOnce(source);
          done();
        }, 1000);
        source.reset();
        typeNonChar();
        sinon.assert.notCalled(source);
      });
    });

    describe('submit', function() {
      describe('without choices', function() {
        beforeEach(function() {
          prompt.run();
          source.reset();
          source.returns(promise);
        });

        it('searches again, since not possible to select something that does not exist', function(done) {
          sinon.assert.notCalled(source);
          enter();
          sinon.assert.notCalled(source);
          setTimeout(() => {
            sinon.assert.calledOnce(source);
            done();
          });
        });
      });

      describe('with suggestOnly', function() {
        var answerValue = {};

        beforeEach(function() {
          promiseForAnswer = getPromiseForAnswer();
          resolve([
            {
              name: 'foo',
              value: answerValue,
              short: 'short',
            },
          ]);
          return promise;
        });

        it('selects the actual value typed');
      });

      describe('with choices', function() {
        var promiseForAnswer;
        var answerValue = {};

        beforeEach(function() {
          promiseForAnswer = getPromiseForAnswer();
          resolve([
            {
              name: 'foo',
              value: answerValue,
              short: 'short',
            },
          ]);
          return promise;
        });

        it('stores the value as the answer and status to answered', function() {
          enter();
          return promiseForAnswer.then(function(answer) {
            expect(answer).to.equal(answerValue);
            expect(prompt.answer).to.equal(answerValue);
            expect(prompt.shortAnswer).to.equal('short');
            expect(prompt.answerName).to.equal('foo');
            expect(prompt.status).to.equal('answered');
          });
        });

        describe('after selecting', function() {
          beforeEach(function() {
            enter();
            source.reset();
            return promiseForAnswer;
          });

          it('stops searching on typing', function() {
            type('test');
            sinon.assert.notCalled(source);
          });

          it('does not change answer on enter', function() {
            enter();
            sinon.assert.notCalled(source);
            return promiseForAnswer.then(function(answer) {
              expect(answer).to.equal(answerValue);
              expect(prompt.answer).to.equal(answerValue);
              expect(prompt.status).to.equal('answered');
            });
          });
        });
      });
    });
  });

  function getPromiseForAnswer() {
    return prompt.run();
  }

  function typeNonChar() {
    rl.input.emit('keypress', '', {
      name: 'shift',
    });
  }

  function type(word) {
    word.split('').forEach(function(char) {
      rl.line = rl.line + char;
      rl.input.emit('keypress', char);
    });
  }

  function moveDown() {
    rl.input.emit('keypress', '', {
      name: 'down',
    });
  }

  function moveUp() {
    rl.input.emit('keypress', '', {
      name: 'up',
    });
  }

  function enter(line) {
    rl.emit('line', line);
  }

  function tab() {
    rl.input.emit('keypress', '', {
      name: 'tab',
    });
  }
});
