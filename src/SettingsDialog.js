import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import { KeyboardDatePicker } from '@material-ui/pickers';
import addDays from 'date-fns/addDays';
import isWeekend from 'date-fns/isWeekend';
import faker from 'faker';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { PropTypes } from 'prop-types';
import React, { useState, useEffect, useContext } from 'react';
import DevelopmentDaysContext from './DevelopmentDaysContext';
import RowContext from './RowContext';
import WorkingDatesContext from './WorkingDatesContext';

const calculateWorkingDates = (startDate, sprintDays) => {
  let loop = true;
  let counter = 0;
  const workingDates = [];
  while (loop) {
    const date = addDays(startDate, counter);

    if (!isWeekend(date)) {
      workingDates.push(date);
    }

    counter += 1;
    if (workingDates.length >= sprintDays) {
      loop = false;
    }
  }

  return workingDates;
};

function SettingsDialog({ onClose, open }) {
  const [startDate, setStartDate] = useState(new Date());
  const [sprintDays, setSprintDays] = useState(10);
  const [developmentRatio, setDevelopmentRatio] = useState(0.6);
  const { rows, setRows } = useContext(RowContext);
  const { setWorkingDates } = useContext(WorkingDatesContext);
  const { setDevelopmentDays } = useContext(DevelopmentDaysContext);

  useEffect(() => {
    setWorkingDates(calculateWorkingDates(startDate, sprintDays));
  }, [startDate, sprintDays]);

  useEffect(() => {
    setDevelopmentDays(sprintDays * developmentRatio);
  }, [sprintDays, developmentRatio]);

  const handleSprintDaysChange = event => {
    setSprintDays(parseInt(event.target.value, 10));
  };

  const handleDevelopmentRatioChange = (event, newValue) => {
    setDevelopmentRatio(newValue);
  };

  const handleAddDeveloper = () => {
    const updated = produce(rows, draft => {
      draft.splice(rows.length - 1, 0, { id: nanoid(), name: faker.name.findName(), developer: true, list: [] });
    });

    setRows(updated);
  };

  const handleRemoveDeveloper = id => {
    const updated = produce(rows, draft => {
      const index = draft.findIndex(todo => todo.id === id);
      if (index !== -1) {
        draft.splice(index, 1);
      }
    });

    setRows(updated);
  };

  const handleDeveloperNameChange = (id, value) => {
    const updated = produce(rows, draft => {
      const index = draft.findIndex(row => row.id === id);
      // eslint-disable-next-line no-param-reassign
      draft[index].name = value;
    });

    setRows(updated);
  };

  // const handleOnClose =

  return (
    <>
      <Dialog onClose={onClose} open={open}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <div style={{ display: 'grid', padding: '20px' }}>
            <KeyboardDatePicker
              margin="normal"
              id="date-picker-dialog"
              label="Select start date"
              format="MM/dd/yyyy"
              value={startDate}
              onChange={setStartDate}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
            />
            <TextField
              label="Sprint Days"
              variant="outlined"
              type="number"
              value={sprintDays}
              onChange={handleSprintDaysChange}
            />
            <Typography gutterBottom>Development Ratio</Typography>
            <Slider
              value={developmentRatio}
              onChange={handleDevelopmentRatioChange}
              aria-labelledby="discrete-slider"
              valueLabelDisplay="auto"
              step={0.1}
              marks
              min={0.1}
              max={1}
            />
            <Typography gutterBottom>Developers</Typography>
            {rows
              .filter(r => !!r.developer)
              .map(row => {
                return (
                  <div key={row.id} style={{ display: 'flex' }}>
                    <TextField
                      variant="outlined"
                      value={row.name}
                      onChange={event => {
                        handleDeveloperNameChange(row.id, event.target.value);
                      }}
                    />
                    <IconButton
                      aria-label="remove"
                      onClick={() => {
                        handleRemoveDeveloper(row.id);
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </div>
                );
              })}
            <Button startIcon={<AddIcon />} onClick={handleAddDeveloper}>
              Add Developer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

SettingsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default SettingsDialog;
