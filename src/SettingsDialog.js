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
import isSameDay from 'date-fns/isSameDay';
import isWeekend from 'date-fns/isWeekend';
import faker from 'faker';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { PropTypes } from 'prop-types';
import React, { useState, useEffect, useContext } from 'react';
import DevelopmentDaysContext from './DevelopmentDaysContext';
import RowContext from './RowContext';
import WorkingDatesContext from './WorkingDatesContext';
import usePersistentState from './usePersistentState';

const calculateWorkingDates = (startDate, sprintDays, offDays) => {
  let loop = true;
  let counter = 0;
  const workingDates = [];
  while (loop) {
    const date = addDays(startDate, counter);
    const isOffDay = offDays.some(offDay => isSameDay(offDay.value, date));

    if (!isWeekend(date) && !isOffDay) {
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
  const [sprintDays, setSprintDays] = useState(10);
  const [developmentRatio, setDevelopmentRatio] = usePersistentState('developmentRatio', 0.6);
  const [offDays, setOffDays] = useState([]);
  const { rows, setRows } = useContext(RowContext);
  const { workingDates, setWorkingDates } = useContext(WorkingDatesContext);
  const [firstWorkingDate] = workingDates;
  const initialStartDate = firstWorkingDate || new Date();
  const [startDate, setStartDate] = useState(initialStartDate);
  const { setDevelopmentDays } = useContext(DevelopmentDaysContext);

  useEffect(() => {
    setWorkingDates(calculateWorkingDates(startDate, sprintDays, offDays));
  }, [startDate, sprintDays, offDays]);

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
        const taskBucket = draft.find(row => row.name === 'Task Bucket');

        // eslint-disable-next-line security/detect-object-injection
        const row = draft[index];

        row.list.forEach(task => taskBucket.list.push(task));

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

  const setOffDayDate = (id, event) => {
    const updated = produce(offDays, draft => {
      const index = draft.findIndex(row => row.id === id);
      // eslint-disable-next-line no-param-reassign
      draft[index].value = event;
    });

    setOffDays(updated);
  };

  const handleOffDayRemove = id => {
    const updated = produce(offDays, draft => {
      const index = draft.findIndex(offday => offday.id === id);

      draft.splice(index, 1);
    });

    setOffDays(updated);
  };

  const addOffDay = () => {
    const updated = produce(offDays, draft => {
      draft.splice(offDays.length - 1, 0, { id: nanoid(), value: null });
    });

    setOffDays(updated);
  };

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
              format="dd/MM/yyyy"
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
            <Typography gutterBottom>Off Days</Typography>
            {offDays
              .filter(o => !!o.id)
              .map(offDay => {
                return (
                  <div key={offDay.id} style={{ display: 'flex' }}>
                    <KeyboardDatePicker
                      margin="normal"
                      id="date-picker-dialog"
                      label="Select date"
                      format="dd/MM/yyyy"
                      value={offDay.value}
                      onChange={event => {
                        setOffDayDate(offDay.id, event);
                      }}
                      KeyboardButtonProps={{
                        'aria-label': 'change date',
                      }}
                    />
                    <IconButton
                      aria-label="remove"
                      onClick={() => {
                        handleOffDayRemove(offDay.id);
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </div>
                );
              })}
            <Button startIcon={<AddIcon />} onClick={addOffDay}>
              Add Off Days
            </Button>
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
