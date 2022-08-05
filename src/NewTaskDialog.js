import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import produce from 'immer';
import { nanoid } from 'nanoid';
import { PropTypes } from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import RowContext from './RowContext';

const EMPTY_NEW_TASK = {
  key: '',
  name: '',
  placeholder: false,
  estimate: '',
};

function NewTaskDialog({ onClose, open }) {
  const [newTask, setNewTask] = useState(EMPTY_NEW_TASK);
  const [taskAssignee, setTaskAssignee] = useState('Task Bucket');
  const { rows, setRows } = useContext(RowContext);

  useEffect(() => {
    if (open === false) {
      setNewTask(EMPTY_NEW_TASK);
      setTaskAssignee('Task Bucket');
    }
  }, [open]);

  const handleNewTaskEstimateChange = (event, newValue) => {
    setNewTask({
      ...newTask,
      estimate: newValue,
    });
  };

  const handleNewTaskKeyChange = event => {
    setNewTask({
      ...newTask,
      key: event.target.value,
    });
  };

  const handleNewTaskPlaceholderChange = event => {
    setNewTask({
      ...newTask,
      placeholder: event.target.checked,
    });
  };

  const handleAddNewTask = () => {
    const updatedRows = produce(rows, draft => {
      const taskBucketRowIndex = draft.findIndex(row => row.name === taskAssignee);

      // eslint-disable-next-line security/detect-object-injection
      const taskBucket = draft[taskBucketRowIndex];

      taskBucket.list.push({
        id: nanoid(),
        custom: true,
        key: newTask.key,
        placeholder: newTask.placeholder,
        summary: '',
        estimate: newTask.estimate,
        backgroundColor: undefined,
        components: [],
        labels: [],
      });
    });

    setRows(updatedRows);
    onClose();
  };

  const handleDeveloperSelect = event => {
    setTaskAssignee(event.target.value);
  };

  return (
    <>
      <Dialog onClose={onClose} open={open}>
        <DialogTitle>New Task</DialogTitle>
        <DialogContent>
          <div style={{ display: 'grid', padding: '20px' }}>
            <TextField
              label="Key"
              variant="outlined"
              type="text"
              value={newTask.key}
              onChange={handleNewTaskKeyChange}
            />
            <FormControlLabel
              label="Is Placeholder"
              control={<Checkbox checked={newTask.placeholder} onChange={handleNewTaskPlaceholderChange} />}
            />
            <Typography gutterBottom>Estimate</Typography>
            <Slider
              value={newTask.estimate}
              onChange={handleNewTaskEstimateChange}
              aria-labelledby="discrete-slider"
              valueLabelDisplay="auto"
              step={0.5}
              marks
              min={0.0}
              max={6}
            />
            <FormControl>
              <InputLabel id="task-assignee-select-label">Assignee</InputLabel>
              <Select
                labelId="task-assignee-select-label"
                id="task-assignee-select"
                value={taskAssignee}
                onChange={handleDeveloperSelect}
              >
                {rows
                  .filter(row => row.id)
                  .map(row => (
                    <MenuItem key={row.id} value={row.name}>
                      {row.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button startIcon={<AddIcon />} onClick={handleAddNewTask}>
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

NewTaskDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default NewTaskDialog;
