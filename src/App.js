import Badge from '@material-ui/core/Badge';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import InfoIcon from '@material-ui/icons/Info';
import NotesIcon from '@material-ui/icons/Notes';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import RemoveIcon from '@material-ui/icons/Remove';
import SettingsIcon from '@material-ui/icons/Settings';
import { KeyboardDatePicker } from '@material-ui/pickers';
import addDays from 'date-fns/addDays';
import format from 'date-fns/format';
import isWeekend from 'date-fns/isWeekend';
import faker from 'faker';
import html2canvas from 'html2canvas';
import { produce } from 'immer';
import groupBy from 'lodash/groupBy';
import { nanoid } from 'nanoid';
import React, { useState, useEffect } from 'react';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CSVReader } from 'react-papaparse';
import './App.css';

const COLOR_TASK = '#cbdadb';
const COLOR_DEV_DATE = '#99B898';
const COLOR_DATE = '#f8fbff';
const COLOR_ASSIGNEE = '#f8fbff';
const COLOR_1 = '#a8e6cf';
const COLOR_2 = '#dcedc1';
const COLOR_3 = '#ffd3b6';
const COLOR_4 = '#ffaaa5';
const COLOR_5 = '#ff8b94';
const ISSUE_KEY = 'Issue key';
const ISSUE_ID = 'Issue id';
const ISSUE_SUMMARY = 'Summary';
const ISSUE_PARENT_ID = 'Parent id';
const ISSUE_ESTIMATE = 'Σ Original Estimate';
const ISSUE_COMPONENTS = 'Components';
const ISSUE_LABELS = 'Labels';
const ISSUE_LINK_END_TO_START = 'Outward issue link (Gantt End to Start)';
const ISSUE_LINK_END_TO_END = 'Outward issue link (Gantt End to End)';

const isWeekDay = date => {
  return !isWeekend(date);
};

const addBusinessDays = (date, count) => {
  let ctr = 1;
  let nextDate = date;

  while (ctr <= count) {
    nextDate = addDays(nextDate, 1);

    if (isWeekDay(nextDate)) {
      ctr += 1;
    }
  }

  return nextDate;
};

const calculateWorkingDates = (startDate, sprintDays) => {
  let loop = true;
  let counter = 0;
  const workingDates = [];
  while (loop) {
    const date = addDays(startDate, counter);

    if (isWeekDay(date)) {
      workingDates.push(date);
    }

    counter += 1;
    if (workingDates.length >= sprintDays) {
      loop = false;
    }
  }

  return workingDates;
};

const getItemStyle = (draggableStyle = {}, backgroundColor = COLOR_TASK, widthMultiplier = 0.5) => ({
  // some basic styles to make the jiras look a bit nicer
  userSelect: 'none',
  padding: '0 0 0 0',
  margin: 0,
  boxShadow: '#302828 0px 0px 2px 0px inset',
  textAlign: 'center',
  minWidth: 100 * widthMultiplier,
  maxWidth: 100 * widthMultiplier,
  display: 'grid',

  // change background colour if dragging
  background: backgroundColor,

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver, style = {}) => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  display: 'flex',
  padding: 8,
  minHeight: 36,
  margin: '0 0 0 10px',
  width: '100%',
  ...style,
});

const StyledBadge = withStyles(() => ({
  badge: {
    right: 18,
    top: 13,
    border: `2px solid black`,
    padding: '0 4px',
  },
}))(Badge);

const COMPONENT_LOOKUP = {
  'Back-End': 'be',
  'Front-End': 'fe',
  QA: 'qa',
};

const LABEL_LOOKUP = {
  technical_task: 'tech',
};

const EMPTY_NEW_TASK = {
  key: '',
  name: '',
  placeholder: false,
  estimate: '',
};

function App() {
  const [rows, setRows] = useState([
    {
      id: nanoid(),
      name: 'Task Bucket',
      developer: false,
      list: [],
      style: { flexWrap: 'wrap' },
    },
  ]);
  const [links, setLinks] = useState([]);
  const [dialog, setDialog] = useState({ open: false, title: '', content: '' });
  const [workingDates, setWorkingDates] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [sprintDays, setSprintDays] = useState(10);
  const [developmentRatio, setDevelopmentRatio] = useState(0.6);
  const [developmentDays, setDevelopmentDays] = useState(sprintDays * developmentRatio);
  const [openSettings, setOpenSettings] = useState(false);
  const [openNewTask, setOpenNewTask] = useState(false);
  const [newTask, setNewTask] = useState(EMPTY_NEW_TASK);

  useEffect(() => {
    setWorkingDates(calculateWorkingDates(startDate, sprintDays));
  }, [startDate, sprintDays]);

  useEffect(() => {
    setDevelopmentDays(sprintDays * developmentRatio);
  }, [sprintDays, developmentRatio]);

  const onDragEnd = result => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    const updated = produce(rows, draft => {
      const destinationRowIndex = draft.findIndex(row => row.name === destination.droppableId);
      const sourceRowIndex = draft.findIndex(row => row.name === source.droppableId);

      const s = draft[sourceRowIndex];
      const d = draft[destinationRowIndex];

      const [removed] = s.list.splice(source.index, 1);
      d.list.splice(destination.index, 0, removed);
    });

    setRows(updated);
  };

  const handleOnDrop = csvRows => {
    csvRows.pop();
    const { data: csvHeaders } = csvRows.shift();
    const issueKeyIndex = csvHeaders.findIndex(h => h === ISSUE_KEY);
    const issueIdIndex = csvHeaders.findIndex(h => h === ISSUE_ID);
    const issueSummaryIndex = csvHeaders.findIndex(h => h === ISSUE_SUMMARY);
    const issueParentIdIndex = csvHeaders.findIndex(h => h === ISSUE_PARENT_ID);
    const issueEstimateIndex = csvHeaders.findIndex(h => h === ISSUE_ESTIMATE);
    const issueComponentsIndexes = csvHeaders.map((h, i) => (h === ISSUE_COMPONENTS ? i : '')).filter(String);
    const issueLabelIndexes = csvHeaders.map((h, i) => (h === ISSUE_LABELS ? i : '')).filter(String);
    const endToEndLinkedIndexes = csvHeaders.map((h, i) => (h === ISSUE_LINK_END_TO_END ? i : '')).filter(String);
    const endToStartLinkedIndexes = csvHeaders.map((h, i) => (h === ISSUE_LINK_END_TO_START ? i : '')).filter(String);

    const colorPalette = [COLOR_1, COLOR_2, COLOR_3, COLOR_4, COLOR_5];
    const backgroundColorPerParentIds = csvRows.reduce((acc, { data }) => {
      const parentId = data[issueParentIdIndex];

      if (parentId === '') {
        return acc;
      }

      if (!acc[parentId]) {
        acc[parentId] = COLOR_TASK;
      } else if (acc[parentId] === COLOR_TASK) {
        acc[parentId] = colorPalette.shift();
      }

      return acc;
    }, {});

    const updatedLinks = produce(links, draft => {
      csvRows.forEach(({ data }) => {
        endToEndLinkedIndexes.forEach(index => {
          if (data[index] !== '') {
            draft.push({
              key: data[issueKeyIndex],
              text: 'has to be finished together',
              issue: data[index],
            });

            draft.push({
              key: data[index],
              text: 'has to be finished together',
              issue: data[issueKeyIndex],
            });
          }
        });

        endToStartLinkedIndexes.forEach(index => {
          if (data[index] !== '') {
            draft.push({
              key: data[issueKeyIndex],
              text: 'has to be done before',
              issue: data[index],
            });

            draft.push({
              key: data[index],
              text: 'has to be done after',
              issue: data[issueKeyIndex],
            });
          }
        });
      });
    });

    const updatedRows = produce(rows, draft => {
      const taskBucketRowIndex = draft.findIndex(row => row.name === 'Task Bucket');

      const taskBucket = draft[taskBucketRowIndex];

      csvRows.forEach(({ data }) => {
        const id = data[issueIdIndex];
        taskBucket.list.push({
          id: id || nanoid(),
          key: data[issueKeyIndex] || nanoid(),
          placeholder: !id,
          summary: data[issueSummaryIndex],
          estimate: data[issueEstimateIndex] / 28800,
          backgroundColor: backgroundColorPerParentIds[data[issueParentIdIndex]],
          components: issueComponentsIndexes.reduce((acc, curr) => {
            const component = COMPONENT_LOOKUP[data[curr]];
            if (!component) {
              return acc;
            }

            acc.push(component);

            return acc;
          }, []),
          labels: issueLabelIndexes.reduce((acc, curr) => {
            const label = LABEL_LOOKUP[data[curr]];
            if (!label) {
              return acc;
            }

            acc.push(label);

            return acc;
          }, []),
        });
      });
    });

    setRows(updatedRows);
    setLinks(updatedLinks);
  };

  const handleOnError = err => {
    console.log(err);
  };

  const handleOnRemoveFile = data => {
    console.log('---------------------------');
    console.log(data);
    console.log('---------------------------');
  };

  const handleInfoClick = (issueKey, issueSummary) => {
    const linkedIssues = links.filter(link => link.key === issueKey);

    const linkedIssuesByText = groupBy(linkedIssues, 'text');
    setDialog({
      open: true,
      title: issueKey,
      content: (
        <>
          <Typography variant="body1" gutterBottom>
            {issueSummary}
          </Typography>
          {linkedIssues.length > 0 && (
            <>
              {Object.entries(linkedIssuesByText).map(([key, issues]) => {
                return (
                  <>
                    <Typography variant="subtitle1">{key}:</Typography>
                    {issues.map(link => (
                      <Typography key={link.issue} variant="subtitle2">
                        {link.issue}
                      </Typography>
                    ))}
                  </>
                );
              })}
            </>
          )}
        </>
      ),
    });
  };

  const handleDialogClose = () => {
    setDialog({
      open: false,
      title: '',
      content: '',
    });
  };

  const handleGenerateReport = () => {
    const items = rows.reduce((acc, row) => {
      for (let i = 0, len = row.list.length; i < len; i++) {
        let date;
        if (i === 0) {
          [date] = workingDates;
        } else {
          date = acc.find(item => item.id === row.list[i - 1].id).releaseDate;
        }

        const item = row.list[i];
        acc.push({
          id: item.id,
          key: item.key,
          releaseDate: addBusinessDays(date, item.estimate),
        });
      }

      return acc;
    }, []);

    const dateGroup = groupBy(items, 'releaseDate');

    const html = Object.keys(dateGroup)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => {
        const tasks = dateGroup[date].filter(task => !task.placeholder);

        return (
          <>
            <span>{format(new Date(date), 'do MMM')}:</span>
            <ol>
              {tasks.map(task => (
                <li key={task.key}>{`https://altayerdigital.atlassian.net/browse/${task.key}`}</li>
              ))}
            </ol>
          </>
        );
      });

    setDialog({
      open: true,
      title: 'Task Grouped By Release Date',
      content: html,
    });
  };

  const takeScreenshot = () => {
    const input = document.getElementById('screenshot');
    html2canvas(input, {
      backgroundColor: null,
      allowTaint: true,
      scale: 2,
    }).then(canvas => {
      // eslint-disable-next-line no-undef
      canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]));

      setDialog({
        open: true,
        title: 'Screenshot copied to clipboard',
      });
    });
  };

  const handleSprintDaysChange = event => {
    setSprintDays(parseInt(event.target.value, 10));
  };

  const handleSettings = () => {
    setOpenSettings(true);
  };

  const handleSettingsClose = () => {
    setOpenSettings(false);
  };

  const handleDevelopmentRatioChange = (event, newValue) => {
    setDevelopmentRatio(newValue);
  };

  const handleNewTask = () => {
    setOpenNewTask(true);
  };

  const handleNewTaskClose = () => {
    setOpenNewTask(false);
    setNewTask(EMPTY_NEW_TASK);
  };

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
    console.log(newTask);

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
    handleNewTaskClose();
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

  return (
    <>
      <CSVReader
        onDrop={handleOnDrop}
        onError={handleOnError}
        style={{ dropArea: { margin: '20px' } }}
        config={{}}
        addRemoveButton
        onRemoveFile={handleOnRemoveFile}
      >
        <span>Drop CSV file here or click to upload.</span>
      </CSVReader>
      <ButtonGroup disableElevation variant="contained" style={{ marginBottom: '20px' }}>
        <Button startIcon={<SettingsIcon />} onClick={handleSettings}>
          Settings
        </Button>
        <Button startIcon={<NotesIcon />} onClick={handleGenerateReport}>
          Text Report
        </Button>
        <Button startIcon={<PhotoCameraIcon />} onClick={takeScreenshot}>
          Screenshot
        </Button>
        <Button startIcon={<AddIcon />} onClick={handleNewTask}>
          Add Task
        </Button>
      </ButtonGroup>
      <Dialog onClose={handleDialogClose} open={dialog.open}>
        <DialogTitle>{dialog.title}</DialogTitle>
        <DialogContent>{dialog.content}</DialogContent>
      </Dialog>
      <Dialog onClose={handleSettingsClose} open={openSettings}>
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
      <Dialog onClose={handleNewTaskClose} open={openNewTask}>
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
      <div style={{ width: 'fit-content' }} id="screenshot">
        <div style={{ display: 'flex' }}>
          <div style={{ minWidth: 180, minHeight: '50px' }}></div>
          <Card style={getListStyle()}>
            {workingDates.map((date, i) => (
              <CardContent key={date} style={getItemStyle({}, i < developmentDays ? COLOR_DEV_DATE : COLOR_DATE, 1)}>
                {format(date, 'do MMM')}
              </CardContent>
            ))}
          </Card>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          {rows.map(row => {
            const total = row.list
              .filter(i => i.labels.indexOf('tech') === -1)
              .reduce((acc, curr) => acc + (curr.placeholder ? 0 : curr.estimate), 0);

            return (
              <div key={row.name} style={{ display: 'flex', marginTop: '10px' }}>
                <StyledBadge badgeContent={total} color={total > developmentDays ? 'error' : 'primary'}>
                  <Card style={{ minWidth: 180, background: COLOR_ASSIGNEE }}>
                    <CardContent>{row.name}</CardContent>
                  </Card>
                </StyledBadge>
                <Droppable droppableId={row.name} direction="horizontal">
                  {(droppableProvided, droppableSnapshot) => (
                    <div
                      ref={droppableProvided.innerRef}
                      style={getListStyle(droppableSnapshot.isDraggingOver, row.style)}
                      {...droppableProvided.droppableProps}
                    >
                      {row.list.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {provided => (
                            <StyledBadge badgeContent={item.placeholder ? null : item.estimate} color="primary">
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(provided.draggableProps.style, item.backgroundColor, item.estimate)}
                              >
                                <CardHeader
                                  subheader={item.placeholder ? '' : item.key}
                                  style={{ maxWidth: `${100 * item.estimate}px`, padding: '16px 4px 0 4px' }}
                                />
                                <CardContent style={{ maxWidth: `${100 * item.estimate}px`, padding: '0 4px 0 4px' }}>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    component="p"
                                    style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                                  >
                                    {item.summary}
                                  </Typography>
                                </CardContent>
                                <CardActions
                                  disableSpacing
                                  style={{ maxWidth: `${100 * item.estimate}px`, padding: '0 4px 0 4px' }}
                                >
                                  {!item.placeholder && (
                                    <IconButton
                                      aria-label="add to favorites"
                                      onClick={() => {
                                        handleInfoClick(item.key, item.summary);
                                      }}
                                    >
                                      <InfoIcon />
                                    </IconButton>
                                  )}
                                  {!item.placeholder &&
                                    [...item.components, ...item.labels].map(component => (
                                      <Chip key={`${item.id}:${component}`} label={component} variant="outlined" />
                                    ))}
                                </CardActions>
                              </Card>
                            </StyledBadge>
                          )}
                        </Draggable>
                      ))}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    </>
  );
}

export default App;
