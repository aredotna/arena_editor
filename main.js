import './css/style.sass';
import API from './API';
import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown';
import HasMentions from './src/HasMentions';
import MentionEditor from './src/Editor';

const MAX_RESULTS = 6;

// "enum" for mention types
const TYPES = {
  User: 'users',
  Channel: 'channels',
  Block: 'blocks'
};

// for determining mention type by url
// and extracting its id
const URL_REGEXES = {
  [TYPES.User]: /^\/([^\/]+)$/,
  [TYPES.Block]: /^\/block\/([0-9]+)$/,
  [TYPES.Channel]: /^\/(?!block)[^\/]+\/([^\/]+)$/
};

function coerceMention(data) {
  // coerce mention data (e.g. block/channel/user)
  // into a standard format so we can treat them interchangeably
  let mention = {};
  let type;
  if (data.class === 'User') {
    type = TYPES.User;
  } else if (data.class === 'Channel') {
    type = TYPES.Channel;
  } else {
    type = TYPES.Block;
  }

  // figure out url and image based on type
  let url, desc = '', image = null;
  if (type === TYPES.User) {
    url = `/${data.slug}`;
    image = data.avatar_image.thumb;
    if (data.metadata) {
      desc = data.metadata.description;
    }
  } else if (type === TYPES.Channel) {
    url = `/${data.user.slug}/${data.slug}`;
    if (data.metadata) {
      desc = data.metadata.description;
    }
  } else {
    url = `/block/${data.id}`;
    desc = data.description;
    if (data.image) {
      image = data.image.thumb.url;
    }
  }
  desc = desc || '';

  mention.data = data;
  mention.id = data.slug ? data.slug : data.id;
  mention.title = data.title ? data.title : data.username;
  mention.class = data.class;
  mention.type = type;
  mention.image = image;
  mention.url = url;
  mention.desc = desc;
  mention.desc_short = desc.length <= 150 ? desc : desc.substr(0, 150) + '...';

  mention.plainText =`[${mention.title}](${mention.url})`;
  return mention;
}

function queryMention(mentionType, query) {
  return API.get(`/search/${mentionType}`, {q: query}).then((data) => {
    let results = data[mentionType].map((mention) => coerceMention(mention));

    // limit results
    return results.slice(0, MAX_RESULTS);
  });;
}


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
    let m = coerceMention(mention);
    if (m && m.type === TYPES.Channel) {
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

  loadMention(path) {
    let type = Object.keys(URL_REGEXES).find((k) => {
      return URL_REGEXES[k].test(path);
    });
    if (!type) return;

    let matches = path.match(URL_REGEXES[type]);
    if (matches.length <= 1) return;

    let endpoint;
    let id = matches[1];
    if (type === TYPES.User) {
      endpoint = `/users/${id}`;
    } else if (type === TYPES.Channel) {
      endpoint = `/channels/${id}`;
    } else if (type === TYPES.Block) {
      endpoint = `/blocks/${id}`;
    } else {
      return;
    }

    return API.get(endpoint, {});
  }


  render() {
    return (
      <div id='app'>
        <MentionEditor
          name='editor'
          mentionQueryDelay={300}
          triggers={{
            '@': queryMention.bind(this, TYPES.User),
            '%': queryMention.bind(this, TYPES.Block),
            '#': queryMention.bind(this, TYPES.Channel)
          }}
          renderItem={this.renderMenuItem.bind(this)}
          onChange={this.onEditorChange.bind(this)} />
        <HasMentions
          loadMention={this.loadMention.bind(this)}
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
