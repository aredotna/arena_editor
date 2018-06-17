import PropTypes from 'prop-types';
import React, {Component} from 'react';

// component which pops over other elements
// and will reposition itself as best it can
// so that it doesn't bleed out the window
class Popover extends Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    shouldReposition: PropTypes.func.isRequired,

    // anchor rect
    anchor: PropTypes.shape({
      top: PropTypes.number.isRequired,
      left: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired
    }).isRequired,

    offset: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    }).isRequired
  }

  constructor(props) {
    super(props);
    this.state = {
      top: 0,
      left: 0
    };
    this.el = React.createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    // adjust position so it doesn't bleed out of the window
    // TODO if no configuration fits the whole thing, prioritize showing the top
    if (this.props.isVisible && this.props.shouldReposition()) {
      let top = this.state.top;
      let left = this.state.left;
      let rect = this.el.current.getBoundingClientRect();

      // y
      if (rect.bottom > window.innerHeight) {
        console.log('BLEEDING')
        top = this.props.anchor.top - rect.height - this.props.offset.y;
      } else {
        top = this.props.anchor.top + this.props.anchor.height + this.props.offset.y;
      }

      // x
      if (rect.right > window.innerWidth) {
        left = this.props.anchor.left - rect.width + this.props.anchor.width - this.props.offset.x;
      } else {
        left = this.props.anchor.left + this.props.offset.x;
      }

      if (top !== this.state.top || left !== this.state.left) {
        this.setState({ top, left });
      }
    }
  }

  render() {
    let {isVisible, className, anchor, offset, shouldReposition, style, ...rest} = this.props;
    let display = isVisible ? 'block' : 'none';
    return (
      <div className={`popover ${className}`} style={{top: this.state.top, left: this.state.left, display: display, ...style}} ref={this.el} {...rest}>
        {this.props.children}
      </div>
    );
  }
}

export default Popover;
