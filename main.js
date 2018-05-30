import './css/style.sass';
import API from './api';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import React, {Component} from 'react';
import getCaretCoordinates from 'textarea-caret';

class MentionMenu extends Component {
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
      focusedWord: null
    };
  }

  queryMention(q) {
    // API.get('/search', {q: q}, (data) => {
    //   // TODO how to sort?
    //   let results = data.blocks.concat(data.channels).concat(data.users);
    //   console.log(results);
    //   this.setState({mentionResults: results});
    // });
    let results = [{
      title: 'Test Block',
      base_class: 'Block'
    }, {
      title: 'Test Channel',
      base_class: 'Channel'
    }, {
      title: 'Test User',
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

    // get caret position
    // and focused word position
    let caret = getCaretCoordinates(ev.target, ev.target.selectionEnd);
    let caretWordStart = getCaretCoordinates(ev.target, ev.target.selectionEnd - focusedWordStart[0].length);

    // in mention mode if focused word starts with '@'
    let mentionMode = focusedWord[0] === '@';
    if (mentionMode) {
      // TODO testing
      this.queryMention('francis');
    }

    this.setState({
      caretPosition: {
        top: caret.top + 45, // TODO compute this height shift
        left: caretWordStart.left + 25 // TODO compute this width shift
      },
      focusedWord: focusedWord,
      mentionMode: mentionMode
    });
  }

  onKeyDown(ev) {
    if (this.state.mentionMode && ev.key === 'Tab') {
      ev.preventDefault();
    }
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

    this.setState({
      focusLineStart,
      focusLineEnd,
      focusLine,
      beforeLines,
      afterLines,
    });
  }

  onChange(ev) {
    this.setState({value: ev.target.value});
  }

  render() {
    return (
      <div id="editor">
        {this.state.mentionMode && this.state.caretPosition && (
          <ul id="mention-menu" style={this.state.caretPosition}>
            {this.state.mentionResults.map((r, i) => {
              return (
                <li key={i}>
                  <figure>
                    <img src='/thumb.jpg' alt='Test Thumb' title='Test Thumb' />
                  </figure>
                  <div className='mention-menu--info'>
                    <div className='mention-menu--title'>{r.title}</div>
                    <div className='mention-menu--class'>{r.base_class}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div id="input">
          <textarea
            name={this.props.name}
            value={this.state.value}
            onChange={this.onChange.bind(this)}
            onFocus={this.updateFocusedLine.bind(this)}
            onClick={this.updateFocusedLine.bind(this)}
            onKeyUp={this.onKeyUp.bind(this)}
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

