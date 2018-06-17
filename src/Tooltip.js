import Popover from './Popover';
import Mention from './Mention';
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

export default MentionTooltip;
