// @flow

/**
 * `autocomplete` type prompt
 */

var chalk = require('chalk');
var figures = require('figures');
var Base = require('inquirer/lib/prompts/base');
var Choices = require('inquirer/lib/objects/choices');
var observe = require('inquirer/lib/utils/events');
var utils = require('inquirer/lib/utils/readline');
var Paginator = require('inquirer/lib/utils/paginator');
var runAsync = require('run-async');
var { takeWhile, map } = require('rxjs/operators');
var debounce = require('lodash.debounce');

class AutocompletePrompt extends Base {
  constructor(
    questions /*: Array<any> */,
    rl /*: readline$Interface */,
    answers /*: Array<any> */
  ) {
    super(questions, rl, answers);
    this.opt = Object.assign(
      {
        searchText: 'Searching...',
        noResultText: 'No results...',
      },
      this.opt
    );
    if (!this.opt.source) {
      this.throwParamError('source');
    }

    this.currentChoices = [];

    this.firstRender = true;
    this.selected = 0;
    // Make sure no default is set (so it won't be printed)
    if (!this.opt.suggestOnly && typeof this.opt.default === 'string') {
      this.rl.line = this.opt.default;
      this.rl.cursor = this.opt.default.length;
      this.opt.default = null;
    }
    this.paginator = new Paginator();
    this.search = debounce(this.undebouncedSearch, this.opt.throttleWaitMilliseconds || 400);
  }

  filterInput(input /*: string */) {
    if (!input) {
      // eslint-disable-next-line no-eq-null, eqeqeq
      return this.opt.default == null ? '' : this.opt.default;
    }
    return input;
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  _run(cb /*: Function */) /*: this*/ {
    this.done = cb;

    if (this.rl.history instanceof Array) {
      this.rl.history = [];
    }

    var events = observe(this.rl);
    var submit = events.line.pipe(map(this.filterInput.bind(this)));

    const dontHaveAnswer = () => {
      return !this.answer;
    };

    submit.pipe(takeWhile(dontHaveAnswer)).forEach(this.onSubmit.bind(this));

    events.keypress
      .pipe(takeWhile(dontHaveAnswer))
      .forEach(this.onKeypress.bind(this));

    // Call once at init
    this.undebouncedSearch(this.rl.line);

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {undefined}
   */
  render(error /*: ?string */) {
    // Render question
    var content = this.getQuestion();
    var bottomContent = '';

    if (this.firstRender && !this.rl.line) {
      var suggestText = this.opt.suggestOnly ? ', tab to autocomplete' : '';
      content += chalk.dim(
        '(Use arrow keys or type to search' + suggestText + ')'
      );
    }
    // Render choices or answer depending on the state
    if (this.status === 'answered') {
      content += chalk.cyan(this.shortAnswer || this.answerName || this.answer);
    } else if (this.searching) {
      content += this.rl.line;
      if (this.opt.searchText)
        bottomContent += '  ' + chalk.dim(this.opt.searchText);
    } else if (this.currentChoices.length) {
      var choicesStr = listRender(this.currentChoices, this.selected);
      content += this.rl.line;
      bottomContent += this.paginator.paginate(
        choicesStr,
        this.selected,
        this.opt.pageSize
      );
    } else {
      content += this.rl.line;
      if (this.opt.noResultText)
        bottomContent += '  ' + chalk.yellow(this.opt.noResultText);
    }

    if (error) {
      bottomContent += '\n' + chalk.red('>> ') + error;
    }
    this.firstRender = false;

    this.screen.render(content, bottomContent);
  }

  /**
   * When user press `enter` key
   */
  onSubmit(line /* : string */) {
    if (typeof this.opt.validate === 'function' && this.opt.suggestOnly) {
      var validationResult = this.opt.validate(line);
      if (validationResult !== true) {
        this.render(
          validationResult || 'Enter something, tab to autocomplete!'
        );
        return;
      }
    }

    var choice = {};
    if (this.currentChoices.length <= this.selected && !this.opt.suggestOnly) {
      this.rl.write(line);
      this.search(line);
      return;
    }

    if (this.opt.suggestOnly) {
      choice.value = line || this.rl.line;
      this.answer = line || this.rl.line;
      this.answerName = line || this.rl.line;
      this.shortAnswer = line || this.rl.line;
      this.rl.line = '';
    } else {
      choice = this.currentChoices.getChoice(this.selected);
      this.answer = choice.value;
      this.answerName = choice.name;
      this.shortAnswer = choice.short;
    }

    runAsync(this.opt.filter, (err, value) => {
      choice.value = value;
      this.answer = value;

      if (this.opt.suggestOnly) {
        this.shortAnswer = value;
      }

      this.status = 'answered';
      // Rerender prompt
      this.render();
      this.screen.done();
      this.done(choice.value);
    })(choice.value);
  }

  undebouncedSearch(searchTerm /* : ?string */) {
    var self = this;
    self.selected = 0;
    var searchingTime;
    // Only render searching state after first time
    if (self.searchedOnce) {
      searchingTime = setTimeout(function() {
        self.searching = true;
        self.currentChoices = new Choices([]);
        self.render(); // Now render current searching state
      }, 300);
    } else {
      self.searchedOnce = true;
    }
    self.lastSearchTerm = searchTerm;
    var source = () => self.opt.source(self.answers, searchTerm, this.rl);

    // Store this promise for check in the callback
    self.lastSource = source;

    return Promise.resolve()
      .then(() => source())
      .then(function inner(choices) {
        clearTimeout(searchingTime);

        choices = choices || [];
        // If another search is triggered before the current search finishes, don't set results
        if (source !== self.lastSource) return;

        choices = new Choices(
          choices.filter(function(choice) {
            return choice.type !== 'separator';
          })
        );

        self.currentChoices = choices;
        self.searching = false;
        self.render();
      })
      .catch(function(error) {
        clearTimeout(searchingTime);

        self.searching = false;
        self.render(String(error));
      });
  }

  ensureSelectedInRange() {
    var selectedIndex = Math.min(this.selected, this.currentChoices.length); // Not above currentChoices length - 1
    this.selected = Math.max(selectedIndex, 0); // Not below 0
  }

  /**
   * When user type
   */

  onKeypress(e /* : {key: { name: string }, value: string} */) {
    var len;
    var keyName = (e.key && e.key.name) || undefined;

    var prevCursor = this.prevCursor || 0;
    this.prevCursor = this.rl.cursor;
    var isCursorUpdated = prevCursor !== this.rl.cursor;

    if (keyName === 'tab' && this.opt.suggestOnly) {
      if (this.currentChoices.getChoice(this.selected)) {
        var sel = this.currentChoices.getChoice(this.selected);
        var autoCompleted = sel.value;
        this.rl.cursor =
          typeof sel.cursor === 'number' ? sel.cursor : autoCompleted.length;
        this.rl.line = autoCompleted;
        this.render();
      }
    } else if (keyName === 'down') {
      len = this.currentChoices.length;
      this.selected = this.selected < len - 1 ? this.selected + 1 : 0;
      this.ensureSelectedInRange();
      this.render();
      utils.up(this.rl, 2);
    } else if (keyName === 'up') {
      len = this.currentChoices.length;
      this.selected = this.selected > 0 ? this.selected - 1 : len - 1;
      this.ensureSelectedInRange();
      this.render();
    } else {
      // Only search if input have actually changed, not because of other keypresses
      this.render(); // Render input automatically

      if (isCursorUpdated) {
        this.search(this.rl.line); // Trigger new search
      }
    }
  }
}

/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(choices, pointer /*: string */) /*: string */ {
  var output = '';
  var separatorOffset = 0;

  choices.forEach(function(choice, i) {
    if (choice.type === 'separator') {
      separatorOffset++;
      output += '  ' + choice + '\n';
      return;
    }

    var isSelected = i - separatorOffset === pointer;
    var line = (isSelected ? figures.pointer + ' ' : '  ') + choice.name;

    if (isSelected) {
      line = chalk.cyan(line);
    }
    output += line + ' \n';
  });

  return output.replace(/\n$/, '');
}

AutocompletePrompt.sliceInput = require('./slice-input');

module.exports = AutocompletePrompt;
