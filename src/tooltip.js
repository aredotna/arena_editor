import Mention from './mention';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class MentionTooltip extends Component {
  render() {
    let m = this.props.mention;
    let meta;
    if (m.type === Mention.Type.Channel) {
      let users = [m.data.user.username];
      users = users.concat(m.data.collaborators.map((c) => c.username));
      meta = `${m.data.length} blocks; ${users.join(', ')}`;
    }
    return (
      <div id="tooltip" style={{top: this.props.top, left: this.props.left}}>
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

  // hide tooltip when focus moves elsewhere
  onBlur() {
    this.setState({ showTooltip: false });
  }

  render() {
    return (
      <div className='contains-mentions' onMouseMove={this.checkHover.bind(this)} onBlur={this.onBlur.bind(this)}>
        {this.state.showTooltip && <MentionTooltip top={this.state.tooltipTop} left={this.state.tooltipLeft} mention={this.state.tooltipMention} />}
        {this.props.children}
      </div>);
  }
}

export default ContainsMentions;
