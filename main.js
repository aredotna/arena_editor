import './css/style.sass';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import React, {Component} from 'react';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '# This is a header\n\nAnd this is a paragraph',
      focusLineStart: 0,
      focusLineEnd: 0,
      focusLine: [],
      beforeLines: [],
      afterLines: []
    };
  }

  updateFocus(ev) {
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
        <div id="input">
          <textarea
            name={this.props.name}
            value={this.state.value}
            onChange={this.onChange.bind(this)}
            onKeyUp={this.updateFocus.bind(this)}
            onFocus={this.updateFocus.bind(this)}
            onClick={this.updateFocus.bind(this)}
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

class App extends Component {
  render() {
    return <Editor name='editor' />;
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

