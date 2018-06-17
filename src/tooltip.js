import Mention from './mention';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class MentionTooltip extends Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,

    // anchor rect
    anchor: PropTypes.shape({
      top: PropTypes.number.isRequired,
      left: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired
    }),

    offset: PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired
    })
  }

  constructor(props) {
    super(props);
    this.state = {
      top: 0,
      left: 0
    };
    this.tooltip = React.createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    // adjust position so it doesn't bleed out of the window
    if (this.props.isVisible && prevProps.mention != this.props.mention) {
      let top = this.state.top;
      let left = this.state.left;
      let rect = this.tooltip.current.getBoundingClientRect();

      // y
      if (rect.bottom > window.innerHeight) {
        top = this.props.anchor.top - rect.height - this.props.offset.y;
      } else {
        top = this.props.anchor.top + this.props.anchor.height + this.props.offset.y;
      }

      // x
      if (rect.right > window.innerWidth) {
        left = this.props.anchor.left - rect.width + this.props.anchor.width + this.props.offset.x;
      } else {
        left = this.props.anchor.left - this.props.offset.x;
      }

      if (top !== this.state.top || left !== this.state.left) {
        this.setState({ top, left });
      }
    }
  }

  render() {
    let meta;
    let m = this.props.mention || {};
    let display = this.props.isVisible ? 'block' : 'none';
    if (m && m.type === Mention.Type.Channel) {
      let users = [m.data.user.username];
      users = users.concat(m.data.collaborators.map((c) => c.username));
      meta = `${m.data.length} blocks; ${users.join(', ')}`;
    }
    return (
      <div id="tooltip" style={{top: this.state.top, left: this.state.left, display: display}} ref={this.tooltip} >
        {m.image &&
          <figure>
              <img src={m.image} alt={m.title} title={m.title} />
          </figure>}
        <div className='tooltip--info'>
          <div className='tooltip--title'>{m.title}</div>
          {meta && <div className='tooltip--meta'>{meta}</div>}
          <div className='tooltip--desc'>{m.desc_short}</div>
        </div>
      </div>
    );
  }
}

class ContainsMentions extends Component {
  static propTypes = {
    tooltipXOffset: PropTypes.number,
    tooltipYOffset: PropTypes.number
  }

  static defaultProps = {
    tooltipXOffset: 0,
    tooltipYOffset: 3,
  }

  constructor(props) {
    super(props);
    this.state = {
      showTooltip: false
    };
  }

  // check if we're hovering over an internal link
  checkHover(ev) {
    // first, check if <a> tag with internal link
    let el = ev.target;
    if (el.tagName === 'A') {
      let host = el.host;
      if (host === window.location.host) {
        let path = el.pathname;

        // debouncing to prevent
        // redundant requests
        if (path !== this.state.tooltipPath) {
          let queryTime = new Date();
          this.setState({
            tooltipLoading: true,
            tooltipQueryTime: queryTime
          });
          Mention.fromURL(path, (mention) => {
            // check that this is the latest query
            if (queryTime != this.state.tooltipQueryTime) {
              return;
            }

            // if so, show tooltip
            this.setState({
              showTooltip: true,
              tooltipLoading: false,
              tooltipAnchor: {
                top: el.offsetTop,
                left: el.offsetLeft,
                height: el.offsetHeight,
                width: el.offsetWidth
              },
              tooltipMention: mention
            });
          });

        } else if (!this.state.tooltipLoading) {
          // if done loading, show tooltip
          this.setState({
            showTooltip: true,
            tooltipAnchor: {
              top: el.offsetTop,
              left: el.offsetLeft,
              height: el.offsetHeight,
              width: el.offsetWidth
            }
          });
        }

        this.setState({
          tooltipPath: el.pathname
        });
      }
    } else {
      this.setState({ showTooltip: false });
    }
  }

  // hide tooltip when focus moves elsewhere
  onBlur() {
    this.setState({ showTooltip: false });
  }

  render() {
    return (
      <div className='contains-mentions' onMouseMove={this.checkHover.bind(this)} onBlur={this.onBlur.bind(this)}>
        <MentionTooltip anchor={this.state.tooltipAnchor} mention={this.state.tooltipMention} isVisible={this.state.showTooltip} offset={{x: this.props.tooltipXOffset, y: this.props.tooltipYOffset}} />
        {this.props.children}
      </div>);
  }
}

export default ContainsMentions;
