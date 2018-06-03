import './css/style.sass';
import API from './api';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import React, {Component} from 'react';
import getCaretCoordinates from 'textarea-caret';

// for dev purposes
const OFFLINE = false;

// how long to wait for the user to stop typing
// before we execute a search
const MENTION_QUERY_DELAY = 300;

// "enum" for mention types
const MENTION_TYPES = {
  User: 'users',
  Channel: 'channels',
  Block: 'blocks'
};

// what char triggers a search for what mention type
const MENTION_CHARS = {
  '@': MENTION_TYPES.User,
  '%': MENTION_TYPES.Block,
  '#': MENTION_TYPES.Channel
};

// reverse lookup of mention chars to mention types
const CHAR_MENTIONTYPES = Object.keys(MENTION_CHARS).reduce((o, k) => {
   o[MENTION_CHARS[k]] = k;
   return o;
}, {});

// TODO
// - if in an existing mention, try to find the block/channel/user it belongs to,
//   and put that at the top of mention menu results

class MentionMenu extends Component {
  static propTypes = {
    id: PropTypes.string,
    style: PropTypes.object,

    // optional status message
    status: PropTypes.string,

    // menu item objects to include
    items: PropTypes.array.isRequired,

    // whether or not the menu should be open
    isOpen: PropTypes.bool.isRequired,

    // what to do when menu is blurred
    onBlur: PropTypes.func.isRequired,

    // what to do when selection is cancelled
    onCancel: PropTypes.func.isRequired,

    // what to do when selection is made
    onSelect: PropTypes.func.isRequired
  }

  static defaultProps = {
    id: 'mention-menu',
    style: {}
  }

  constructor(props) {
    super(props);
    this.state = {
      focused: false,
      focusedIndex: 0
    };

    // track menu item nodes,
    // for focusing
    this.items = [];
  }

  componentDidUpdate(prevProps, prevState) {
    // if items change, re-focus to first item
    if (prevProps.items !== this.props.items) {
      this.setState({ focusedIndex: 0 });

    // when menu opens from closed state, re-focus to first item
    } else if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.setState({ focusedIndex: 0 });
    }
  }

  focus() {
    // focus on the menu
    if (this.items.length > 0) {
      this.items[this.state.focusedIndex].focus();
    }
  }

  onKeyDown(ev) {
    // implemented to meet ARIA specs:
    // <https://www.w3.org/TR/wai-aria-practices/#menu>

    // move focus down one item,
    // wrapping to first if at end
    if (ev.key === 'ArrowDown') {
      let next = this.state.focusedIndex + 1;
      next = next % this.items.length;
      this.setState({ focusedIndex: next });
      this.items[next].focus();

    // move focus up one item,
    // wrapping to last if at start
    } else if (ev.key === 'ArrowUp') {
      let prev = this.state.focusedIndex - 1;
      prev = prev < 0 ? this.items.length - 1 : prev;
      this.setState({ focusedIndex: prev });
      this.items[prev].focus();

    // cancel selection
    } else if (ev.key === 'Escape') {
      this.props.onCancel();

    // make selection
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      this.props.onSelect(this.props.items[this.state.focusedIndex]);

    // blur
    } else if (ev.shiftKey && ev.key === 'Tab') {
      this.props.onBlur();

    } else {
      return;
    }

    // override default key actions,
    // e.g. arrow down would normally scroll the page down
    ev.preventDefault();
  }

  render() {
    // only display menu if
    // it is specified to be open
    let display = this.props.isOpen && (this.props.items.length > 0 || this.props.status) ? 'block' : 'none';

    return (
      <div
        id={this.props.id}
        role='menu'
        aria-live={true}
        style={{display: display, ...this.props.style}}
        onKeyDown={this.onKeyDown.bind(this)}>
        {this.props.status && <div className='mention-menu--status' role='status'>{this.props.status}</div>}
        <ul>
          {this.props.items.map((item, i) => {
            return (
              <li key={item.id}
                tabIndex='-1'
                role='menuitem'
                aria-posinset={i}
                aria-setsize={this.props.items.length}
                onClick={() => this.props.onSelect(item)}
                ref={(node) => this.items[i] = node}>
                <figure>
                  {item.image &&
                    <img src={item.image} alt={item.title} title={item.title} />}
                </figure>
                <div className='mention-menu--info'>
                  <div className='mention-menu--title'>{item.title}</div>
                  <div className='mention-menu--class'>{item.class}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    )
  }
}

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '# This is a header\n\nAnd this is a paragraph',

      // number of lines and lines
      // up to selection start
      focusLinesStart: 0,
      beforeFocusedLines: [],

      // number of lines and lines
      // after selection end
      focusLinesEnd: 0,
      afterFocusedLines: [],

      // the focused/selected lines
      focusLines: [],

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
    if (OFFLINE) {
      let results = [{
        id: 0,
        title: 'Test Block',
        slug: 'test-block',
        class: 'Link',
        base_class: 'Block',
        image: {
          thumb: {
            url: '/thumb.jpg'
          }
        }
      }, {
        id: 1,
        title: 'Test Channel',
        slug: 'test-channel',
        class: 'Channel',
        base_class: 'Channel',
        image: {
          thumb: {
            url: '/thumb.jpg'
          }
        }
      }, {
        id: 2,
        title: 'Test User',
        slug: 'test-user',
        class: 'User',
        base_class: 'User',
        image: {
          thumb: {
            url: '/thumb.jpg'
          }
        }
      }];
      this.setState({ mentionResults: results });
    } else {
      this.setState({ mentionMenuStatus: 'Searching...' });
      API.get(`/search/${mentionType}`, {q: q}, (data) => {
        let results = data[mentionType].map(this.standardizeMentionResult(mentionType));

        // limit 10 results
        results = results.slice(0, 10);
        let status = results.length === 0 ? 'No results found.' : null;
        this.setState({ mentionResults: results, mentionMenuStatus: status });
      });
    }
  }

  standardizeMentionResult(mentionType) {
    // coerce mention data (e.g. block/channel/user)
    // into a standard format so we can treat them interchangeably
    return (mention) => {
      // TODO this can be more robust
      return {
        id: mention.slug ? mention.slug : mention.id,
        title: mention.title ? mention.title : mention.username,
        image: mention.image ? mention.image.thumb.url : mention.avatar_image.thumb,
        class: mention.class,
        type: mentionType
      }
    }
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
    let mentionMode = firstChar in MENTION_CHARS;
    if (mentionMode) {
      let mentionType = MENTION_CHARS[firstChar];
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
            console.log('executing query');
            this.queryMention(query, mentionType);
          }, MENTION_QUERY_DELAY);
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
    let focusLinesStart = value.substr(0, textarea.selectionStart).split('\n').length;
    let selectionLength = textarea.selectionEnd - textarea.selectionStart;

    let nSelectedLines;
    if (textarea.selectionStart === textarea.selectionEnd) {
      nSelectedLines = 0;
    } else {
      nSelectedLines = value.substr(textarea.selectionStart, selectionLength).split('\n').length - 1;
    }

    let focusLinesEnd = focusLinesStart + nSelectedLines;
    let beforeFocusedLines = lines.slice(0, focusLinesStart-1);
    let afterFocusedLines = lines.slice(focusLinesEnd, lines.length);
    let focusLines = lines.slice(focusLinesStart-1, focusLinesEnd);

    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;

    this.setState({
      focusLinesStart,
      focusLinesEnd,
      focusLines,
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
    let mentionChar = CHAR_MENTIONTYPES[mention.type];
    value = `${beforeMention}${mentionChar}${mention.id}${space}${afterMention}`;

    // update the textarea value,
    // close the mention menu,
    // and re-insert caret after the inserted mention
    // (+2 for the MENTION_CHAR and the space)
    this.setState({
      value: value,
      mentionMenuOpen: false,
      caret: this.state.focusedWordStart + mention.id.length + 2
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // when mention menu closes, re-focus textarea and insert caret at proper location
    if (prevState.mentionMenuOpen != this.state.mentionMenuOpen && !this.state.mentionMenuOpen) {
      this.textarea.current.focus();
      this.textarea.current.selectionStart = this.state.caret;
      this.textarea.current.selectionEnd = this.state.caret;
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
        <div id="preview">
          <ReactMarkdown source={this.state.beforeFocusedLines.join('\n')} />
          <div style={{background: '#f2f7c8', fontFamily: 'monospace', whiteSpace: 'pre-line'}}>{this.state.focusLines.join('\n')}</div>
          <ReactMarkdown source={this.state.afterFocusedLines.join('\n')} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Editor name='editor' />,
  document.getElementById('root')
);

