import './css/style.sass';
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown';
import HasMentions from './src/HasMentions';
import MentionEditor from './src/Editor';
import Mention from './example/Mention';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
  }

  onEditorChange(state) {
    this.setState({ text: state.value });
  }

  renderMentionTooltip(mention) {
    if (!mention) return;
    let meta;
    let m = new Mention(mention);
    if (m && m.type === Mention.Type.Channel) {
      let users = [m.data.user.username];
      users = users.concat(m.data.collaborators.map((c) => c.username));
      meta = `${m.data.length} blocks; ${users.join(', ')}`;
    }
    return (
      <div>
        {m.image &&
        <figure>
            <img src={m.image} alt={m.title} title={m.title} />
        </figure>}
        <div className='tooltip--info'>
          <div className='tooltip--title'>{m.title}</div>
          {meta && <div className='tooltip--meta'>{meta}</div>}
          <div className='tooltip--desc'>{m.desc_short}</div>
        </div>
      </div>);
  }

  renderMenuItem(item) {
    return (
      <div style={{display: 'flex'}}>
        <figure>
          {item.image &&
              <img src={item.image} alt={item.title} title={item.title} />}
        </figure>
        <div className='mention-menu--info'>
          <div className='mention-menu--title'>{item.title}</div>
          <div className='mention-menu--class'>{item.class}</div>
        </div>
      </div>);
  }

  render() {
    return (
      <div id='app'>
        <MentionEditor
          name='editor'
          mentionQueryDelay={300}
          triggers={{
            '@': Mention.queryUser,
            '%': Mention.queryBlock,
            '#': Mention.queryChannel
          }}
          renderItem={this.renderMenuItem.bind(this)}
          onChange={this.onEditorChange.bind(this)} />
        <HasMentions
          loadMention={Mention.fromURL}
          renderMention={this.renderMentionTooltip.bind(this)}>
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
