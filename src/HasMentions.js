import Popover from './Popover';
import PropTypes from 'prop-types';
import React, {Component} from 'react';

class HasMentions extends Component {
  static propTypes = {
    loadMention: PropTypes.func.isRequired,
    renderMention: PropTypes.func.isRequired
  }

  static defaultProps = {
    tooltipOffset: {x: 0, y: 3}
  }

  constructor(props) {
    super(props);
    this.state = {
      showTooltip: false,
      tooltipAnchor: {
        top: 0,
        left: 0,
        height: 0,
        width: 0
      }
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
        let tooltipAnchor = {
          top: el.offsetTop,
          left: el.offsetLeft,
          height: el.offsetHeight,
          width: el.offsetWidth
        };

        // debouncing to prevent
        // redundant requests
        if (path !== this.state.tooltipPath) {
          this.setState({
            tooltipLoading: true
          });

          this.props.loadMention(path).then((mention) => {
            // check that this is the latest query
            if (path != this.state.tooltipPath) {
              return;
            }

            // if so, show tooltip
            this.setState({
              showTooltip: true,
              tooltipLoading: false,
              tooltipMention: mention,
              tooltipAnchor: tooltipAnchor
            });
          });

        } else if (!this.state.tooltipLoading) {
          // if done loading, show tooltip
          this.setState({
            showTooltip: true,
            tooltipAnchor: tooltipAnchor
          });
        }

        this.setState({
          tooltipPath: path
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

  componentDidUpdate(prevProps, prevState) {
    let shouldReposition = prevState.tooltipMention != this.state.tooltipMention;
    if (shouldReposition != this.state.shouldReposition)
      this.setState({ shouldReposition });
  }

  shouldReposition() {
    return this.state.shouldReposition;
  }

  render() {
    return (
      <div
        className={`has-mentions ${this.props.className}`}
        onMouseMove={this.checkHover.bind(this)}
        onBlur={this.onBlur.bind(this)}>
        <Popover
          anchor={this.state.tooltipAnchor}
          isVisible={this.state.showTooltip}
          shouldReposition={this.shouldReposition.bind(this)}
          offset={this.props.tooltipOffset}>
          {this.props.renderMention(this.state.tooltipMention)}
        </Popover>
        {this.props.children}
      </div>);
  }
}

export default HasMentions;
