import './css/style.sass';
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown';
import HasMentions from './src/HasMentions';
import Editor from './src/Editor';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
  }

  onEditorChange(state) {
    this.setState({
      text: state.value
    });
  }

  render() {
    return (
      <div id='app'>
        <Editor name='editor' mentionQueryDelay={300} onChange={this.onEditorChange.bind(this)} />
        <HasMentions id='preview'>
          <ReactMarkdown source={this.state.text} />
        </HasMentions>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
