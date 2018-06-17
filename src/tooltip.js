import Mention from './mention';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class MentionTooltip extends Component {
  static propTypes = {
    isVisible: PropTypes.bool.isRequired
  }

  constructor(props) {
    super(props);
    this.tooltip = React.createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    // so we can keep track of the tooltip position and size
    if (this.props.isVisible) {
      let rect = this.tooltip.current.getBoundingClientRect();
      this.props.onRectChange(rect);
    }
  }

  render() {
    let m = this.props.mention || {};
    let meta;
    if (m && m.type === Mention.Type.Channel) {
      let users = [m.data.user.username];
      users = users.concat(m.data.collaborators.map((c) => c.username));
      meta = `${m.data.length} blocks; ${users.join(', ')}`;
    }
    let display = this.props.isVisible ? 'block' : 'none';
    return (
      <div id="tooltip" style={{top: this.props.top, left: this.props.left, display: display}} ref={this.tooltip} >
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
    yOffset: PropTypes.number
  }

  static defaultProps = {
    yOffset: 3
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
              hoveredEl: el,
              showTooltip: true,
              tooltipLoading: false,
              tooltipTop: el.offsetTop + el.offsetHeight + this.props.yOffset,
              tooltipLeft: el.offsetLeft,
              tooltipMention: mention
            });
          });

        } else if (!this.state.tooltipLoading) {
          // if done loading, show tooltip
          this.setState({
            hoveredEl: el,
            showTooltip: true,
            tooltipTop: el.offsetTop + el.offsetHeight + this.props.yOffset,
            tooltipLeft: el.offsetLeft
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

  // reposition the tooltip
  // if it falls outside the window
  onTooltipRectChange(rect) {
    let el = this.state.hoveredEl;
    if (rect.bottom > window.innerHeight) {
      this.setState({ tooltipTop: this.state.hoveredEl.offsetTop - rect.height - this.props.yOffset });
    }
    if (rect.right > window.innerWidth) {
      this.setState({ tooltipLeft: this.state.hoveredEl.offsetLeft - rect.width + this.state.hoveredEl.offsetWidth });
    }
  }

  // hide tooltip when focus moves elsewhere
  onBlur() {
    this.setState({ showTooltip: false });
  }

  render() {
    return (
      <div className='contains-mentions' onMouseMove={this.checkHover.bind(this)} onBlur={this.onBlur.bind(this)}>
        <MentionTooltip top={this.state.tooltipTop} left={this.state.tooltipLeft} mention={this.state.tooltipMention} isVisible={this.state.showTooltip} onRectChange={this.onTooltipRectChange.bind(this)} />
        {this.props.children}
      </div>);
  }
}

export default ContainsMentions;
