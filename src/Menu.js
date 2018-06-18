import API from './API';
import Mention from './Mention';
import Popover from './Popover';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class MentionMenu extends Component {
  static propTypes = {
    style: PropTypes.object,

    // max query results to show
    maxResults: PropTypes.number,

    // query to search for
    query: PropTypes.string.isRequired,

    // whether or not the menu should be open
    isOpen: PropTypes.bool.isRequired,

    // what to do when menu is blurred
    onBlur: PropTypes.func.isRequired,

    // what to do when selection is cancelled
    onCancel: PropTypes.func.isRequired,

    // what to do when selection is made
    onSelect: PropTypes.func.isRequired,

    // how to render a menu item
    renderItem: PropTypes.func.isRequired
  }

  static defaultProps = {
    style: {},
    maxResults: 6
  }

  constructor(props) {
    super(props);
    this.state = {
      items: [],
      focused: false,
      focusedIndex: 0,
    };

    // track menu item nodes,
    // for focusing
    this.items = [];
  }

  componentDidUpdate(prevProps, prevState) {
    let shouldReposition = false;

    if (prevProps.query !== this.props.query) {
      if (this.props.query == '') {
        this.setState({ items: [] });
      } else {
        this.queryMention(this.props.queryType);
      }
    }

    if (prevProps.anchor !== this.props.anchor || prevState.status !== this.state.status) {
      shouldReposition = true;
    }

    // if items change, re-focus to first item
    if (prevState.items !== this.state.items) {
      this.setState({ focusedIndex: 0 });
      shouldReposition = true;

    // when menu opens from closed state, re-focus to first item
    } else if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.setState({ focusedIndex: 0 });
    }

    if (shouldReposition != this.state.shouldReposition)
      this.setState({ shouldReposition });
  }

  // query API for mention candidates
  queryMention(mentionType) {
    let q = this.props.query;
    this.setState({ status: 'Searching...' });
    API.get(`/search/${mentionType}`, {q: q}, (data) => {
      if (q != this.props.query) {
        return;
      }
      let results = data[mentionType].map((mention) => new Mention(mention, mentionType));

      // limit results
      results = results.slice(0, this.props.maxResults);
      let status = results.length === 0 ? 'No results found.' : null;
      this.setState({ items: results, status: status });
    });
  }

  focus() {
    // focus on the menu
    if (this.items.length > 0) {
      this.items[this.state.focusedIndex].focus();
    }
  }

  onKeyDown(ev) {
    // implemented to meet ARIA specs:
    // <https://www.w3.org/TR/wai-aria-practices/#menu>

    // move focus down one item,
    // wrapping to first if at end
    if (ev.key === 'ArrowDown') {
      let next = this.state.focusedIndex + 1;
      next = next % this.items.length;
      this.setState({ focusedIndex: next });
      this.items[next].focus();

    // move focus up one item,
    // wrapping to last if at start
    } else if (ev.key === 'ArrowUp') {
      let prev = this.state.focusedIndex - 1;
      prev = prev < 0 ? this.items.length - 1 : prev;
      this.setState({ focusedIndex: prev });
      this.items[prev].focus();

    // cancel selection
    } else if (ev.key === 'Escape') {
      this.props.onCancel();

    // make selection
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      this.props.onSelect(this.state.items[this.state.focusedIndex]);

    // blur
    } else if (ev.shiftKey && ev.key === 'Tab') {
      this.props.onBlur();

    } else {
      return;
    }

    // override default key actions,
    // e.g. arrow down would normally scroll the page down
    ev.preventDefault();
  }

  shouldReposition() {
    return this.state.shouldReposition;
  }

  render() {
    // only display menu if it is specified to be open
    let isVisible = this.props.isOpen && (this.state.items.length > 0 || this.state.status !== null);

    return (
      <Popover
        role='menu'
        aria-live={true}
        isVisible={isVisible}
        className='mention-menu'
        anchor={this.props.anchor}
        offset={this.props.offset}
        shouldReposition={this.shouldReposition.bind(this)}
        onKeyDown={this.onKeyDown.bind(this)}>
        {this.state.status && <div className='mention-menu--status' role='status'>{this.state.status}</div>}
        <ul>
          {this.state.items.map((item, i) => {
            return (
              <li key={item.id}
                tabIndex='-1'
                role='menuitem'
                aria-posinset={i}
                aria-setsize={this.state.items.length}
                onClick={() => this.props.onSelect(item)}
                ref={(node) => this.items[i] = node}>
                {this.props.renderItem(item)}
              </li>
            );
          })}
        </ul>
      </Popover>
    )
  }
}

export default MentionMenu;
