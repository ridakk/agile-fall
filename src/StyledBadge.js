import Badge from '@material-ui/core/Badge';
import { withStyles } from '@material-ui/core/styles';

export default withStyles(() => ({
  badge: {
    right: 18,
    top: 13,
    border: `2px solid black`,
    padding: '0 4px',
  },
}))(Badge);
