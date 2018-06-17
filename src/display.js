import Mention from './mention';
import Popover from './popover';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class MentionTooltip extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate(prevProps, prevState) {
    let shouldReposition = prevProps.mention != this.props.mention;
    if (shouldReposition != this.state.shouldReposition)
      this.setState({ shouldReposition });
  }

  shouldReposition() {
    return this.state.shouldReposition;
  }

  render() {
    let meta;
    let m = this.props.mention || {};
    if (m && m.type === Mention.Type.Channel) {
      let users = [m.data.user.username];
      users = users.concat(m.data.collaborators.map((c) => c.username));
      meta = `${m.data.length} blocks; ${users.join(', ')}`;
    }
    return (
      <Popover shouldReposition={this.shouldReposition.bind(this)} {...this.props}>
        {m.image &&
          <figure>
              <img src={m.image} alt={m.title} title={m.title} />
          </figure>}
        <div className='tooltip--info'>
          <div className='tooltip--title'>{m.title}</div>
          {meta && <div className='tooltip--meta'>{meta}</div>}
          <div className='tooltip--desc'>{m.desc_short}</div>
        </div>
      </Popover>
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
        <MentionTooltip
          mention={this.state.tooltipMention}
          anchor={this.state.tooltipAnchor}
          isVisible={this.state.showTooltip}
          offset={{x: this.props.tooltipXOffset, y: this.props.tooltipYOffset}} />
        {this.props.children}
      </div>);
  }
}

export default ContainsMentions;
