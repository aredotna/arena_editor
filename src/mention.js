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


class Mention {
  static Type = TYPES;
  static Char2Types = CHAR_TYPES;
  static Type2Chars = TYPE_CHARS;

  constructor(data, type) {
    // coerce mention data (e.g. block/channel/user)
    // into a standard format so we can treat them interchangeably

    // figure out url and image based on type
    let url, image = null;
    if (type === TYPES.User) {
      url = `/${data.slug}`;
      image = data.avatar_image.thumb;
    } else if (type === TYPES.Channel) {
      url = `/${data.user.slug}/${data.slug}`;
    } else {
      url = `/block/${data.id}`;
      if (data.image) {
        image = data.image.thumb.url;
      }
    }

    this.id = data.slug ? data.slug : data.id;
    this.title = data.title ? data.title : data.username;
    this.class = data.class;
    this.type = type;
    this.image = image;
    this.url = url;

    // let mentionChar = TYPE_CHARS[type];
    // this.plainText = `${mentionChar}${this.id}`;
    this.plainText =`[${this.title}](${this.url})`;
  }
}

export default Mention;
