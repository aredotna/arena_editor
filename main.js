import './css/style.sass';
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown';
import ContainsMentions from './src/tooltip';
import Editor from './src/editor';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      showTooltip: false
    };
  }

  onEditorChange(state) {
    this.setState({
      text: state.value
    });
  }

  render() {
    return (
      <div id="app">
        <Editor name='editor' mentionQueryDelay={300} onChange={this.onEditorChange.bind(this)} />
        <ContainsMentions id='preview'>
          <ReactMarkdown source={this.state.text} />
        </ContainsMentions>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
