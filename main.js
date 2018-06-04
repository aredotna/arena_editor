import './css/style.sass';
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown';
import Editor from './src/editor';
import Mention from './src/mention';

const TOOLTIP_YOFFSET = 3;

class Tooltip extends Component {
  render() {
    let m = this.props.mention;
    let meta;
    if (m.type === Mention.Type.Channel) {
      let users = [m.data.user.username];
      users = users.concat(m.data.collaborators.map((c) => c.username));
      meta = `${m.data.length} blocks; ${users.join(', ')}`;
    }
    return (
      <div id="tooltip" style={{top: this.props.top, left: this.props.left}}>
        {m.image &&
          <figure>
              <img src={m.image} alt={m.title} title={m.title} />
          </figure>}
        <div className='tooltip--info'>
          <div className='tooltip--title'>{m.title}</div>
          {meta && <div className='tooltip--meta'>{meta}</div>}
          <div className='tooltip--desc'>{m.desc_short}</div>
        </div>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      beforeFocusedLines: [],
      afterFocusedLines: [],
      focusedLines: [],

      showTooltip: false
    };
  }

  checkHover(ev) {
    let el = ev.target;
    if (el.tagName === 'A') {
      let host = el.host;
      if (host === window.location.host) {
        let path = el.pathname;

        // debouncing to prevent
        // redundant requests
        if (path !== this.state.tooltipPath) {
          this.setState({
            tooltipLoading: true
          });
          Mention.fromURL(path, (mention) => {
            this.setState({
              showTooltip: true,
              tooltipLoading: false,
              tooltipTop: el.offsetTop + el.offsetHeight + TOOLTIP_YOFFSET,
              tooltipLeft: el.offsetLeft,
              tooltipMention: mention
            });
          });
        } else if (!this.state.tooltipLoading) {
          this.setState({
            showTooltip: true,
            tooltipTop: el.offsetTop + el.offsetHeight + TOOLTIP_YOFFSET,
            tooltipLeft: el.offsetLeft
          });
        }
        this.setState({
          tooltipPath: el.pathname
        });
      }
    } else {
      this.setState({ showTooltip: false });
    }
  }

  onBlur() {
    this.setState({ showTooltip: false });
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
        <div id="preview" onMouseMove={this.checkHover.bind(this)} onBlur={this.onBlur.bind(this)}>
          {this.state.showTooltip && <Tooltip top={this.state.tooltipTop} left={this.state.tooltipLeft} mention={this.state.tooltipMention} />}
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
