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
      focused: 0
    };
    this.menu = React.createRef();
    this.items = [];
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.items.length > 0) {
      this.items[this.state.focused].focus();
    }
    if (this.props.isOpen && prevProps.isOpen != this.props.isOpen) {
      this.items[this.state.focused].focus();
    }
  }

  onKeyDown(ev) {
    if (ev.key === 'ArrowDown') {
      let next = this.state.focused + 1;
      this.setState({ focused: next % this.items.length });

    } else if (ev.key === 'ArrowUp') {
      let prev = this.state.focused - 1;
      prev = prev < 0 ? this.items.length - 1 : prev;
      this.setState({ focused: prev });

    } else if (ev.key === 'Escape') {
      this.props.onCancel();
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      this.props.onSelect(this.props.items[this.state.focused]);
    } else {
      return;
    }
    ev.preventDefault();
  }

  render() {
    let display = this.props.isOpen ? 'block' : 'none';
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
                <img src='/thumb.jpg' alt='Test Thumb' title='Test Thumb' />
              </figure>
              <div className='mention-menu--info'>
                <div className='mention-menu--title'>{item.title}</div>
                <div className='mention-menu--class'>{item.base_class}</div>
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
      mentionMode: false,
      caretPosition: null,
      focusedWord: null,
      mentionMenuOpen: false
    };

    this.textarea = React.createRef();
  }

  queryMention(q) {
    // API.get('/search', {q: q}, (data) => {
    //   // TODO how to sort?
    //   let results = data.blocks.concat(data.channels).concat(data.users);
    //   console.log(results);
    //   this.setState({mentionResults: results});
    // });
    let results = [{
      id: 0,
      title: 'Test Block',
      slug: 'test-block',
      base_class: 'Block'
    }, {
      id: 1,
      title: 'Test Channel',
      slug: 'test-channel',
      base_class: 'Channel'
    }, {
      id: 2,
      title: 'Test User',
      slug: 'test-user',
      base_class: 'User'
    }];
    this.setState({mentionResults: results});
  }

  onKeyUp(ev){
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
    if (mentionMode) {
      // TODO testing
      this.queryMention('francis');
      this.setState({mentionMenuOpen: true});
    }

    this.setState({
      caretPosition: {
        top: caret.top + 45, // TODO compute this height shift
        left: caretWordStart.left + 25 // TODO compute this width shift
      },
      focusedWord: focusedWord,
      focusedWordStart: focusedWordStartPos,
      focusedWordEnd: focusedWordEndPos
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
    console.log(mention.slug);
    console.log(this.state);
    let value = this.state.value;
    let start = this.state.value.substr(0, this.state.focusedWordStart);
    let end = this.state.value.substr(this.state.focusedWordEnd);
    value = `${start}@${mention.slug} ${end}`;
    this.setState({mentionMenuOpen: false, value: value});
    this.textarea.current.focus();
    // TODO
    // this.textarea.current.selectionStart = this.state.focusedWordStart;
    // this.textarea.current.selectionEnd = this.state.focusedWordStart;
    console.log(this.textarea.current);
  }

  componentDidUpdate() {
    // TODO insert caret at proper location
    // if (this.state.selectionStart) {
    //   this.textarea.current.selectionStart = this.state.selectionStart;
    //   this.textarea.current.selectionEnd = this.state.selectionEnd;
    // }
  }

  onChange(ev) {
    this.setState({value: ev.target.value});
  }

  render() {
        // {this.state.mentionMode && this.state.caretPosition && (
        //   <div id="mention-menu" style={this.state.caretPosition}>
        //     <MentionMenu items={this.state.mentionResults} />
        //   </div>
        // )}

    return (
      <div id="editor">
        <MentionMenu
          id='mention-menu'
          style={this.state.caretPosition}
          items={this.state.mentionResults}
          isOpen={this.state.mentionMenuOpen}
          onCancel={() => this.setState({mentionMenuOpen: false})}
          onSelect={this.selectMention.bind(this)}
        />
        <div id="input">
          <textarea
            name={this.props.name}
            value={this.state.value}
            ref={this.textarea}
            onChange={this.onChange.bind(this)}
            onFocus={this.updateFocusedLine.bind(this)}
            onClick={this.updateFocusedLine.bind(this)}
            onKeyUp={this.onKeyUp.bind(this)}
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

