import Popover from './Popover';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class MentionMenu extends Component {
  static propTypes = {
    style: PropTypes.object,

    // optional status message
    status: PropTypes.string,

    // menu item objects to include
    items: PropTypes.array.isRequired,

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
    style: {}
  }

  constructor(props) {
    super(props);
    this.state = {
      focused: false,
      focusedIndex: 0
    };

    // track menu item nodes,
    // for focusing
    this.items = [];
  }

  componentDidUpdate(prevProps, prevState) {
    let shouldReposition = false;

    if (prevProps.anchor !== this.props.anchor || prevProps.status !== this.props.status) {
      shouldReposition = true;
    }

    // if items change, re-focus to first item
    if (prevProps.items !== this.props.items) {
      this.setState({ focusedIndex: 0 });
      shouldReposition = true;

    // when menu opens from closed state, re-focus to first item
    } else if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen) {
      this.setState({ focusedIndex: 0 });
    }

    if (shouldReposition != this.state.shouldReposition)
      this.setState({ shouldReposition });
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
      this.props.onSelect(this.props.items[this.state.focusedIndex]);

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
    let isVisible = this.props.isOpen && (this.props.items.length > 0 || this.props.status !== null);

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
        {this.props.status && <div className='mention-menu--status' role='status'>{this.props.status}</div>}
        <ul>
          {this.props.items.map((item, i) => {
            return (
              <li key={item.id}
                tabIndex='-1'
                role='menuitem'
                aria-posinset={i}
                aria-setsize={this.props.items.length}
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
