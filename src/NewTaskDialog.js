import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
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
  const { rows, setRows } = useContext(RowContext);

  useEffect(() => {
    if (open === false) {
      setNewTask(EMPTY_NEW_TASK);
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
      const taskBucketRowIndex = draft.findIndex(row => row.name === 'Task Bucket');

      const taskBucket = draft[taskBucketRowIndex];

      taskBucket.list.push({
        id: nanoid(),
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
