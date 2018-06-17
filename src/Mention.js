import API from './API';

// "enum" for mention types
const TYPES = {
  User: 'users',
  Channel: 'channels',
  Block: 'blocks'
};

// what char triggers a search for what mention type
const CHAR_TYPES = {
  '@': TYPES.User,
  '%': TYPES.Block,
  '#': TYPES.Channel
};

// reverse lookup of mention chars to mention types
const TYPE_CHARS = Object.keys(CHAR_TYPES).reduce((o, k) => {
   o[CHAR_TYPES[k]] = k;
   return o;
}, {});

// for determining mention type by url
// and extracting its id
const URL_REGEXES = {
  [TYPES.User]: /^\/([^\/]+)$/,
  [TYPES.Block]: /^\/block\/([0-9]+)$/,
  [TYPES.Channel]: /^\/(?!block)[^\/]+\/([^\/]+)$/
};

class Mention {
  static Type = TYPES;
  static Char2Types = CHAR_TYPES;
  static Type2Chars = TYPE_CHARS;

  static fromURL(url, onLoad) {
    let type = Object.keys(URL_REGEXES).find((k) => {
      return URL_REGEXES[k].test(url);
    });
    if (!type) return;

    let matches = url.match(URL_REGEXES[type]);
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

    API.get(endpoint, {}, (data) => {
      if (data.code !== 404) {
        let mention = new Mention(data, type);
        onLoad(mention);
      }
    });
  }

  constructor(data, type) {
    // coerce mention data (e.g. block/channel/user)
    // into a standard format so we can treat them interchangeably

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

    this.data = data;
    this.id = data.slug ? data.slug : data.id;
    this.title = data.title ? data.title : data.username;
    this.class = data.class;
    this.type = type;
    this.image = image;
    this.url = url;
    this.desc = desc;
    this.desc_short = desc.length <= 150 ? desc : desc.substr(0, 150) + '...';

    // let mentionChar = TYPE_CHARS[type];
    // this.plainText = `${mentionChar}${this.id}`;
    this.plainText =`[${this.title}](${this.url})`;
  }
}

export default Mention;
