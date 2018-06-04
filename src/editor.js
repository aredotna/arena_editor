import API from './api';
import Mention from './mention';
import MentionMenu from './menu';
import React, {Component} from 'react';
import getCaretCoordinates from 'textarea-caret';


class Editor extends Component {
  static defaultProps = {
    // how long to wait for the user to stop typing
    // before we execute a search
    mentionQueryDelay: 300,

    onChange: (state) => {}
  }

  constructor(props) {
    super(props);
    this.state = {
      // TODO temp
      value: '# This is a header\n\nAnd this is a paragraph\n\n[user](/francis-tseng)\n\n[elsewhere](https://google.com)\n\n[channel](/francis-tseng/nice-places)\n\n[block](/block/2187236)\n\n',

      // number of lines and lines
      // up to selection start
      focusedLinesStart: 0,
      beforeFocusedLines: [],

      // number of lines and lines
      // after selection end
      focusedLinesEnd: 0,
      afterFocusedLines: [],

      // the focused/selected lines
      focusedLines: [],

      // character position for textarea caret
      caret: 0,

      // pixel position for textarea caret
      caretPosition: null,

      // focused word
      // and focused word start/end character positoins
      focusedWord: null,
      focusedWordStart: 0,
      focusedWordEnd: 0,

      // if mention menu is open or not
      mentionMenuOpen: false,

      // mention menu status to display, e.g. 'Searching'
      mentionMenuStatus: null,

      // for tracking which mention query response
      // is the one we wan't to keep
      // e.g. if query A is executed and then query B,
      // we want to keep the results of query B only.
      // but if query B's results somehow arrive before A,
      // then A's results will overwrite B's. This prevents
      // that from happening.
      mentionQueryTime: null,

      // candidate mention objects for the mention menu
      mentionQuery: '',
      mentionResults: []
    };

    // for managing focus
    this.textarea = React.createRef();
    this.mentionMenu = React.createRef();

    this.mentionQueryTimeout = null;
  }

  // query API for mention candidates
  queryMention(q, mentionType) {
    let queryTime = new Date();
    this.setState({ mentionMenuStatus: 'Searching...', mentionQueryTime: queryTime });
    API.get(`/search/${mentionType}`, {q: q}, (data) => {
      if (queryTime != this.state.mentionQueryTime) {
        return
      }
      let results = data[mentionType].map((mention) => new Mention(mention, mentionType));
      console.log(results);

      // limit 10 results
      results = results.slice(0, 10);
      let status = results.length === 0 ? 'No results found.' : null;
      this.setState({ mentionResults: results, mentionMenuStatus: status });
    });
  }

  onKeyDown(ev) {
    // tab to focus to mention menu, if it's open
    if (ev.key === 'Tab' && this.state.mentionMenuOpen) {
      this.mentionMenu.current.focus();
      ev.preventDefault();
    }
  }

  updateState(ev){
    this.updateFocusedLines(ev);
    this.updateFocusedWord(ev);
  }

  updateFocusedWord(ev) {
    // the "focused word" is the word
    // the caret is inside;
    // e.g. with "hello wo|rld", where "|" is the caret,
    // the focused word is "world"
    let textarea = ev.target;
    let value = textarea.value;
    let caret = textarea.selectionEnd;

    // start and end parts of the focused word
    let focusedWordStart = /\S+$/.exec(value.slice(0, caret)) || [''];
    let focusedWordEnd = /^\S+/.exec(value.slice(caret)) || [''];
    focusedWordStart = focusedWordStart[0];
    focusedWordEnd = focusedWordEnd[0];

    // merge into completed focused word
    let focusedWord = `${focusedWordStart}${focusedWordEnd}`;

    // figure out character positions of focused word start and end
    let focusedWordStartPos = caret - focusedWordStart.length;
    let focusedWordEndPos = caret + focusedWordEnd.length;

    // get caret pixel position
    // and focused word pixel position
    let caretPos = getCaretCoordinates(textarea, caret);
    let caretWordStart = getCaretCoordinates(textarea, focusedWordStartPos);

    // in mention mode if focused word starts a MENTION_CHARS key
    let firstChar = focusedWord[0];
    let mentionMode = firstChar in Mention.Char2Types;
    if (mentionMode) {
      let mentionType = Mention.Char2Types[firstChar];
      let query = focusedWord.slice(1);

      if (this.state.mentionQuery !== query) {
        // reset typing timeout
        if (this.mentionQueryTimeout) {
          clearTimeout(this.mentionQueryTimeout);
        }

        if (!query) {
          this.setState({ mentionResults: [] });
        } else {
          // only execute mention query after
          // no typing for some time
          this.mentionQueryTimeout = setTimeout(() => {
            this.queryMention(query, mentionType);
          }, this.props.mentionQueryDelay);
        }
        this.setState({ mentionQuery: query });
      }
    }

    // for some reason this needs to be doubled?
    // also, for paddingLeft, how to handle R-to-L languages?
    let lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) * 2;
    let paddingLeft = parseFloat(getComputedStyle(textarea).paddingLeft);
    let yOffset = 10;
    let xOffset = 10;

    this.setState({
      caret: caret,
      caretPosition: {
        top: caretPos.top + lineHeight + yOffset,
        left: caretWordStart.left + paddingLeft + xOffset
      },
      focusedWord: focusedWord,
      focusedWordStart: focusedWordStartPos,
      focusedWordEnd: focusedWordEndPos,
      mentionMenuOpen: mentionMode
    });
  }

  updateFocusedLines(ev) {
    // the "focused lines" is
    // either the line the caret is in,
    // or if there is a highlighted selection,
    // the lines that encompass that selection
    let textarea = ev.target;
    let value = textarea.value;
    let lines = value.split('\n');
    let focusedLinesStart = value.substr(0, textarea.selectionStart).split('\n').length;
    let selectionLength = textarea.selectionEnd - textarea.selectionStart;

    let nSelectedLines;
    if (textarea.selectionStart === textarea.selectionEnd) {
      nSelectedLines = 0;
    } else {
      nSelectedLines = value.substr(textarea.selectionStart, selectionLength).split('\n').length - 1;
    }

    let focusedLinesEnd = focusedLinesStart + nSelectedLines;
    let beforeFocusedLines = lines.slice(0, focusedLinesStart-1);
    let afterFocusedLines = lines.slice(focusedLinesEnd, lines.length);
    let focusedLines = lines.slice(focusedLinesStart-1, focusedLinesEnd);

    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;

    this.setState({
      focusedLinesStart,
      focusedLinesEnd,
      focusedLines,
      beforeFocusedLines,
      afterFocusedLines,
      selectionStart,
      selectionEnd
    });
  }

  selectMention(mention) {
    let value = this.state.value;
    let beforeMention = value.substr(0, this.state.focusedWordStart);
    let afterMention = value.substr(this.state.caret);

    // check if we should insert a space after the mention
    // only do so if there isn't already a space after
    let space = afterMention[0] === ' ' ? '' : ' ';

    // update the new textarea value
    value = `${beforeMention}${mention.plainText}${space}${afterMention}`;

    // update the textarea value,
    // close the mention menu,
    // and re-insert caret after the inserted mention
    // (+1 for the space)
    this.setState({
      value: value,
      mentionMenuOpen: false,
      caret: this.state.focusedWordStart + mention.plainText.length + 1
    });
  }

  componentDidMount() {
    this.updateState({target: this.textarea.current});
  }

  componentDidUpdate(prevProps, prevState) {
    // when mention menu closes, re-focus textarea and insert caret at proper location
    if (prevState.mentionMenuOpen != this.state.mentionMenuOpen && !this.state.mentionMenuOpen) {
      this.textarea.current.focus();
      this.textarea.current.selectionStart = this.state.caret;
      this.textarea.current.selectionEnd = this.state.caret;
    }
    if (prevState !== this.state) {
      this.props.onChange(this.state);
    }
  }

  onChange(ev) {
    this.setState({value: ev.target.value});
  }

  render() {
    return (
      <div id="editor">
        <MentionMenu
          id='mention-menu'
          ref={this.mentionMenu}
          status={this.state.mentionMenuStatus}
          style={this.state.caretPosition}
          items={this.state.mentionResults}
          isOpen={this.state.mentionMenuOpen}
          onBlur={() => this.textarea.current.focus()}
          onCancel={() => this.textarea.current.focus()}
          onSelect={this.selectMention.bind(this)}
        />
        <div id="input">
          <textarea
            ref={this.textarea}
            name={this.props.name}
            value={this.state.value}
            onChange={this.onChange.bind(this)}
            onFocus={this.updateState.bind(this)}
            onClick={this.updateState.bind(this)}
            onKeyUp={this.updateState.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
          />
        </div>
      </div>
    );
  }
}

export default Editor;