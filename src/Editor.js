import MentionMenu from './Menu';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import getCaretCoordinates from 'textarea-caret';


class MentionEditor extends Component {
  static propTypes = {
    // character triggers for the MentionMenu
    triggers: PropTypes.object.isRequired,

    // how to render a menu item
    renderItem: PropTypes.func.isRequired
  }

  static defaultProps = {
    // how long to wait for the user to stop typing
    // before we execute a search
    mentionQueryDelay: 300,

    // executed when Editor state changes
    onChange: (state) => {},

    menuOffset: {x: 0, y: 3},
    menuMaxResults: 6
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',

      // character position for textarea caret
      caret: 0,

      // pixel position for textarea caret
      // and width & height
      caretAnchor: {
        top: 0,
        left: 0,
        width: 0,
        height: 0
      },

      // focused mention
      // and focused mention start/end character positoins
      focusedMention: null,
      focusedMentionStart: 0,
      focusedMentionEnd: 0,

      // if mention menu is open or not
      mentionMenuOpen: false,

      // mention menu qyery
      mentionMenuQuery: '',
      mentionMenuQueryExecutor: () => {},
    };

    // for managing focus
    this.textarea = React.createRef();
    this.mentionMenu = React.createRef();

    this.mentionQueryTimeout = null;
  }


  onKeyDown(ev) {
    // tab to focus to mention menu, if it's open
    if (ev.key === 'Tab' && this.state.mentionMenuOpen) {
      this.mentionMenu.current.focus();
      ev.preventDefault();
    }
  }

  updateState(ev){
    this.updateFocusedMention(ev);
  }

  updateMentionRegex() {
    let triggerChars = Object.keys(this.props.triggers).join('|');
    this.wordRegex = new RegExp(`(${triggerChars})\\S+$`);
    this.quotedRegex = new RegExp(`(${triggerChars})"[^"]+"?$`);
  }

  updateFocusedMention(ev) {
    // the "focused mention" is the mention
    // the caret is inside;
    // e.g. with "hello @wo|rld", where "|" is the caret,
    // the focused mention is "world"
    let textarea = ev.target;
    let value = textarea.value;
    let caret = textarea.selectionEnd;

    // check for mention under the cursor
    let wordMentionStart = this.wordRegex.exec(value.slice(0, caret));
    let quotedMentionStart = this.quotedRegex.exec(value.slice(0, caret));

    let trigger,
      mention = '',
      mentionStart = '',
      mentionEnd = '';

    if (quotedMentionStart) {
      mentionStart = quotedMentionStart[0];
      mentionEnd = /^[^"]+"?$/.exec(value.slice(caret)) || [''];
    } else if (wordMentionStart) {
      mentionStart = wordMentionStart[0];
      mentionEnd = /^\S+/.exec(value.slice(caret)) || [''];
    }
    if (mentionStart) {
      trigger = mentionStart[0];

      // strip start/end double quotes
      mention = `${mentionStart.slice(1)}${mentionEnd[0]}`.replace(/^"+|"+$/g, '');
    }

    // figure out character positions of focused mention start and end
    let mentionStartPos = caret - mentionStart.length;
    let mentionEndPos = caret + mentionEnd.length;

    // get caret pixel position
    // and focused mention pixel position
    let caretPos = getCaretCoordinates(textarea, caret);
    let caretMentionStart = getCaretCoordinates(textarea, mentionStartPos);
    let caretMentionEnd = getCaretCoordinates(textarea, mentionEndPos);

    if (mention) {
      let queryExecutor = this.props.triggers[trigger];
      let query = mention;

      if (this.state.mentionMenuQuery !== query) {
        // reset typing timeout
        if (this.mentionQueryTimeout) {
          clearTimeout(this.mentionQueryTimeout);
        }

        if (query === '') {
          this.setState({
            mentionMenuQuery: query,
            mentionMenuType: null,
            mentionMenuOpen: false,
            mentionMenuQueryExecutor: queryExecutor
          });
        } else {
          // only execute mention query after
          // no typing for some time
          this.mentionQueryTimeout = setTimeout(() => {
            this.setState({
              mentionMenuQuery: query,
              mentionMenuOpen: true,
              mentionMenuQueryExecutor: queryExecutor
            });
          }, this.props.mentionQueryDelay);
        }
      }
    } else {
      this.setState({ mentionMenuOpen: false });
    }

    // how to handle R-to-L languages?
    let paddingLeft = parseFloat(getComputedStyle(textarea).paddingLeft);
    let paddingTop = parseFloat(getComputedStyle(textarea).paddingTop);

    this.setState({
      caret: caret,
      caretAnchor: {
        top: caretPos.top + paddingTop,
        left: caretMentionStart.left + paddingLeft,
        height: caretMentionStart.height,
        width: caretMentionEnd.left - caretMentionStart.left
      },
      focusedMention: mention,
      focusedMentionStart: mentionStart,
      focusedMentionEnd: mentionEnd,
      focusedMentionStart: mentionStartPos,
      focusedMentionEnd: mentionEndPos
    });
  }

  selectMention(mention) {
    let value = this.state.value;
    let beforeMention = value.substr(0, this.state.focusedMentionStart);
    let afterMention = value.substr(this.state.caret);

    // check if we should insert a space after the mention
    // only do so if there isn't already a space after
    let space = afterMention[0] === ' ' ? '' : ' ';

    // update the new textarea value
    value = `${beforeMention}${mention.plainText}${space}${afterMention}`;

    // update the textarea value,
    // close the mention menu,
    // and re-insert caret after the inserted mention
    // (+1 for the space)
    this.setState({
      value: value,
      mentionMenuOpen: false,
      caret: this.state.focusedMentionStart + mention.plainText.length + 1
    });
  }

  componentDidMount() {
    this.updateMentionRegex();
    this.updateState({target: this.textarea.current});
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateMentionRegex();
    // when mention menu closes, re-focus textarea and insert caret at proper location
    if (prevState.mentionMenuOpen != this.state.mentionMenuOpen && !this.state.mentionMenuOpen) {
      this.textarea.current.focus();
      this.textarea.current.selectionStart = this.state.caret;
      this.textarea.current.selectionEnd = this.state.caret;
    }
    if (prevState !== this.state) {
      this.props.onChange(this.state);
    }
  }

  onChange(ev) {
    this.setState({value: ev.target.value});
  }

  render() {
    return (
      <div id="editor">
        <MentionMenu
          ref={this.mentionMenu}
          query={this.state.mentionMenuQuery}
          executeQuery={this.state.mentionMenuQueryExecutor}
          renderItem={this.props.renderItem}
          anchor={this.state.caretAnchor}
          offset={this.props.menuOffset}
          items={this.state.mentionResults}
          isOpen={this.state.mentionMenuOpen}
          onBlur={() => this.textarea.current.focus()}
          onCancel={() => this.textarea.current.focus()}
          onSelect={this.selectMention.bind(this)}
        />
        <div id="input">
          <textarea
            ref={this.textarea}
            name={this.props.name}
            value={this.state.value}
            onChange={this.onChange.bind(this)}
            onFocus={this.updateState.bind(this)}
            onClick={this.updateState.bind(this)}
            onKeyUp={this.updateState.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
          />
        </div>
      </div>
    );
  }
}

export default MentionEditor;
