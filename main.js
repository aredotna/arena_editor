import './css/style.sass';
import API from './api';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import React, {Component} from 'react';
import getCaretCoordinates from 'textarea-caret';


class MentionMenu extends Component {
  static propTypes = {
    id: PropTypes.string,
    style: PropTypes.object,
    items: PropTypes.array.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onBlur: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired
  }

  static defaultProps = {
    id: 'mention-menu',
    style: {}
  }

  constructor(props) {
    super(props);
    this.state = {
      focusedIndex: 0,
      focused: false
    };
    this.menu = React.createRef();
    this.items = [];
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.items !== this.props.items) {
      this.setState({ focusedIndex: 0 });
    } else if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.setState({ focusedIndex: 0 });
    }
  }

  focus() {
    if (this.items.length > 0) {
      this.items[this.state.focusedIndex].focus();
    }
  }

  onKeyDown(ev) {
    if (ev.key === 'ArrowDown') {
      let next = this.state.focusedIndex + 1;
      next = next % this.items.length;
      this.setState({ focusedIndex: next });
      this.items[next].focus();

    } else if (ev.key === 'ArrowUp') {
      let prev = this.state.focusedIndex - 1;
      prev = prev < 0 ? this.items.length - 1 : prev;
      this.setState({ focusedIndex: prev });
      this.items[prev].focus();

    } else if (ev.key === 'Escape') {
      this.props.onCancel();

    } else if (ev.key === 'Enter' || ev.key === ' ') {
      this.props.onSelect(this.props.items[this.state.focusedIndex]);

    } else if (ev.shiftKey && ev.key === 'Tab') {
      this.props.onBlur();

    } else {
      return;
    }
    ev.preventDefault();
  }

  render() {
    let display = this.props.isOpen && this.props.items.length > 0 ? 'block' : 'none';
    return (
      <ul
        tabIndex='-1'
        id={this.props.id}
        role='menu'
        ref={this.menu}
        aria-live={true}
        style={{display: display, ...this.props.style}}
        onKeyDown={this.onKeyDown.bind(this)}>
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
                  <img src={item.image.thumb.url} alt={item.title} title={item.title} />}
              </figure>
              <div className='mention-menu--info'>
                <div className='mention-menu--title'>{item.title}</div>
                <div className='mention-menu--class'>{item.class}</div>
              </div>
            </li>
          );
        })}
      </ul>
    )
  }
}

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '# This is a header\n\nAnd this is a paragraph',
      focusLineStart: 0,
      focusLineEnd: 0,
      focusLine: [],
      beforeLines: [],
      afterLines: [],
      mentionResults: [],
      caretPosition: null,
      focusedWord: null,
      mentionMenuOpen: false
    };

    this.textarea = React.createRef();
    this.mentionMenu = React.createRef();
  }

  queryMention(q) {
    if (q) {
      API.get('/search', {q: q}, (data) => {
        // TODO how to sort?
        let results = data.blocks.concat(data.channels).concat(data.users);

        // limit 10 results
        results = results.slice(0, 10);
        console.log(results);
        this.setState({ mentionResults: results });
      });
    } else {
        this.setState({ mentionResults: [] });
    }

    // OFFLINE
    // let results = [{
    //   id: 0,
    //   title: 'Test Block',
    //   slug: 'test-block',
    //   base_class: 'Block'
    // }, {
    //   id: 1,
    //   title: 'Test Channel',
    //   slug: 'test-channel',
    //   base_class: 'Channel'
    // }, {
    //   id: 2,
    //   title: 'Test User',
    //   slug: 'test-user',
    //   base_class: 'User'
    // }];
    // this.setState({mentionResults: results});
  }

  onKeyDown(ev) {
    if (ev.key === 'Tab' && this.state.mentionMenuOpen) {
      this.mentionMenu.current.focus();
      ev.preventDefault();
    }
  }

  updateState(ev){
    this.updateFocusedLine(ev);

    // get word caret is inside
    let focusedWordStart = /\S+$/.exec(ev.target.value.slice(0, ev.target.selectionEnd)) || [''];
    let focusedWordEnd = /^\S+/.exec(ev.target.value.slice(ev.target.selectionEnd)) || [''];
    let focusedWord = `${focusedWordStart}${focusedWordEnd}`;
    let focusedWordStartPos = ev.target.selectionEnd - focusedWordStart[0].length;
    let focusedWordEndPos = ev.target.selectionEnd + focusedWordEnd[0].length;

    // get caret position
    // and focused word position
    let caret = getCaretCoordinates(ev.target, ev.target.selectionEnd);
    let caretWordStart = getCaretCoordinates(ev.target, focusedWordStartPos);

    // in mention mode if focused word starts with '@'
    let mentionMode = focusedWord[0] === '@';
    let query = focusedWord.slice(1);
    if (mentionMode) {
      this.queryMention(query);
    }
    this.setState({mentionMenuOpen: mentionMode});

    this.setState({
      caretPosition: {
        top: caret.top + 45, // TODO compute this height shift
        left: caretWordStart.left + 25 // TODO compute this width shift
      },
      focusedWord: focusedWord,
      focusedWordStart: focusedWordStartPos,
      focusedWordEnd: focusedWordEndPos,
      caret: ev.target.selectionStart
    });
  }

  updateFocusedLine(ev) {
    let textarea = ev.target;
    let value = textarea.value;
    let lines = value.split('\n');
    let focusLineStart = value.substr(0, textarea.selectionStart).split('\n').length;
    let selectionLength = textarea.selectionEnd - textarea.selectionStart;

    let selectedLines;
    if (textarea.selectionStart === textarea.selectionEnd) {
      selectedLines = 0;
    } else {
      selectedLines = value.substr(textarea.selectionStart, selectionLength).split('\n').length - 1;
    }

    let focusLineEnd = focusLineStart + selectedLines;
    let beforeLines = lines.slice(0, focusLineStart-1);
    let afterLines = lines.slice(focusLineEnd, lines.length);
    let focusLine = lines.slice(focusLineStart-1, focusLineEnd);

    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;

    this.setState({
      focusLineStart,
      focusLineEnd,
      focusLine,
      beforeLines,
      afterLines,
      selectionStart,
      selectionEnd
    });
  }

  selectMention(mention) {
    let value = this.state.value;
    let start = this.state.value.substr(0, this.state.focusedWordStart);
    // let end = this.state.value.substr(this.state.focusedWordEnd);
    let end = this.state.value.substr(this.state.caret);

    // check if we should insert a space after the mention
    // only do so if there isn't already a space after.
    let space = end[0] === ' ' ? '' : ' ';

    // update the new textarea value
    value = `${start}@${mention.id}${space}${end}`;

    this.setState({
      mentionMenuOpen: false,
      value: value,
      caret: this.state.focusedWordStart + mention.id.length + 2
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // when menu closes, insert caret at proper location
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
          style={this.state.caretPosition}
          items={this.state.mentionResults}
          isOpen={this.state.mentionMenuOpen}
          onBlur={() => this.textarea.current.focus()}
          onCancel={() => this.textarea.current.focus()}
          onSelect={this.selectMention.bind(this)}
          ref={this.mentionMenu}
        />
        <div id="input">
          <textarea
            name={this.props.name}
            value={this.state.value}
            ref={this.textarea}
            onChange={this.onChange.bind(this)}
            onFocus={this.updateState.bind(this)}
            onClick={this.updateState.bind(this)}
            onKeyUp={this.updateState.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
          />
        </div>
        <div id="preview">
          <ReactMarkdown source={this.state.beforeLines.join('\n')} />
          <div style={{background: '#f2f7c8', fontFamily: 'monospace', whiteSpace: 'pre-line'}}>{this.state.focusLine.join('\n')}</div>
          <ReactMarkdown source={this.state.afterLines.join('\n')} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <Editor name='editor' />,
  document.getElementById('root')
);

