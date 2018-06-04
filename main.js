import './css/style.sass';
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from './src/editor';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      beforeFocusedLines: [],
      afterFocusedLines: [],
      focusedLines: []
    };
  }

  checkHover(ev) {
    if (ev.target.tagName === 'A') {
      let host = ev.target.host;
      if (host === window.location.host) {
        console.log(ev.target.pathname);
      }
    }
  }

  onEditorChange(state) {
    this.setState({
      focusedLines: state.focusedLines,
      beforeFocusedLines: state.beforeFocusedLines,
      afterFocusedLines: state.afterFocusedLines
    });
  }

  render() {
    return (
      <div id="app">
        <Editor name='editor' mentionQueryDelay={300} onChange={this.onEditorChange.bind(this)} />
        <div id="preview" onMouseMove={this.checkHover.bind(this)}>
          <ReactMarkdown source={this.state.beforeFocusedLines.join('\n')} />
          <div style={{background: '#f2f7c8', fontFamily: 'monospace', whiteSpace: 'pre-line'}}>{this.state.focusedLines.join('\n')}</div>
          <ReactMarkdown source={this.state.afterFocusedLines.join('\n')} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
