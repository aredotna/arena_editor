import API from './API';

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

class Mention {
  static Type = TYPES;

  // get candidate mentions from a query, given a mention type
  static query(mentionType, query) {
    return API.get(`/search/${mentionType}`, {q: query}).then((data) => {
      let results = data[mentionType].map((mention) => new Mention(mention));

      // limit results
      return results.slice(0, MAX_RESULTS);
    });
  }

  static queryUser(query) {
    return Mention.query(TYPES.User, query);
  }

  static queryBlock(query) {
    return Mention.query(TYPES.Block, query);
  }

  static queryChannel(query) {
    return Mention.query(TYPES.Channel, query);
  }

  // fetch a single mention
  static fromURL(path) {
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

  constructor(data) {
    // coerce mention data (e.g. block/channel/user)
    // into a standard format so we can treat them interchangeably
    let type;
    if (data.base_class === 'User') {
      type = TYPES.User;
    } else if (data.base_class === 'Channel') {
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

    this.data = data;
    this.id = data.slug ? data.slug : data.id;
    this.title = data.title ? data.title : data.username;
    this.class = data.class;
    this.type = type;
    this.image = image;
    this.url = url;
    this.desc = desc;
    this.desc_short = desc.length <= 150 ? desc : desc.substr(0, 150) + '...';

    this.plainText =`[${this.title}](${this.url})`;
  }
}

export default Mention;
