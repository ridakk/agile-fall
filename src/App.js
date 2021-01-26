import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid'
import faker from 'faker';
import { produce } from 'immer';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import getDay from 'date-fns/getDay'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import groupBy from 'lodash/groupBy';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Badge from '@material-ui/core/Badge';
import { withStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import NotesIcon from '@material-ui/icons/Notes';
import SettingsIcon from '@material-ui/icons/Settings';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';
import TextField from '@material-ui/core/TextField';
import {
  KeyboardDatePicker,
} from '@material-ui/pickers';
import { CSVReader } from 'react-papaparse'
import html2canvas from 'html2canvas'
import './App.css';

const COLOR_TASK = '#cbdadb';
const COLOR_DEV_DATE = '#99B898';
const COLOR_DATE = '#f8fbff'
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

const isWeekDay = (date) => {
  const day = getDay(date);

  switch(day) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
      return true;

    default:
      return false;
  }
}

const addBusinessDays = (date, count) => {
  let ctr = 1;
  let nextDate = date;


  while(ctr <= count) {
     nextDate = addDays(nextDate, 1);

    if (isWeekDay(nextDate)) {
      ctr++;
    }
  }

  return nextDate;
}

const calculateWorkingDates = (startDate, sprintDays) => {
  let loop = true;
  let counter = 0;
  const workingDates = [];
  while(loop) {
    const date = addDays(startDate, counter);

    if (isWeekDay(date)) {
      workingDates.push(date);
    }

    counter++;
    if (workingDates.length >= sprintDays) {
      loop = false;
    }
  }

  return workingDates;
}

const getItemStyle = (isDragging = false, draggableStyle = {}, backgroundColor= COLOR_TASK,  widthMultiplier = 0.5) => ({
  // some basic styles to make the jiras look a bit nicer
  userSelect: 'none',
  padding: '0 0 0 0',
  margin: 0,
  boxShadow: '#302828 0px 0px 2px 0px inset',
  textAlign: 'center',
  minWidth: 100 * widthMultiplier,
  maxWidth: 100 * widthMultiplier,

  // change background colour if dragging
  background: backgroundColor,

  // styles we need to apply on draggables
  ...draggableStyle,
});

const getListStyle = (isDraggingOver, style ={}) => ({
  background: isDraggingOver ? 'lightblue' : 'lightgrey',
  display: 'flex',
  padding: 8,
  minHeight: 36,
  margin: '0 0 0 10px',
  width: '100%',
  ...style
});

const StyledBadge = withStyles((theme) => ({
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
};

const LABEL_LOOKUP = {
  'technical_task': 'tech',
};

function App() {
  const [rows, setRows] = useState([
    {
      id: nanoid(),
      name: 'Task Bucket',
      developer: false,
      list: [],
      style: { flexWrap: 'wrap' }
    }
  ]);
  const [dialog, setDialog] = useState({ open: false, title: '', content: '' });
  const [workingDates, setWorkingDates] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [sprintDays, setSprintDays] = useState(10);
  const [developmentRatio, setDevelopmentRatio] = useState(0.6);
  const [developmentDays, setDevelopmentDays] = useState(sprintDays * developmentRatio);
  const [openSettings, setOpenSettings] = useState(false)


  useEffect(()=> {
    setWorkingDates(calculateWorkingDates(startDate, sprintDays))
  }, [startDate, sprintDays]);

  useEffect(()=> {
    setDevelopmentDays(sprintDays * developmentRatio)
  }, [sprintDays, developmentRatio]);

  const onDragEnd = (result) => {
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

      const [removed]  = s.list.splice(source.index, 1);
      d.list.splice(destination.index, 0, removed);
    });

    setRows(updated)
  }

  const handleOnDrop = (csvRows) => {
    csvRows.pop();
    const { data: csvHeaders } = csvRows.shift();
    const issueKeyIndex = csvHeaders.findIndex(h => h === ISSUE_KEY);
    const issueIdIndex = csvHeaders.findIndex(h => h === ISSUE_ID);
    const issueSummaryIndex = csvHeaders.findIndex(h => h === ISSUE_SUMMARY);
    const issueParentIdIndex = csvHeaders.findIndex(h => h === ISSUE_PARENT_ID);
    const issueEstimateIndex = csvHeaders.findIndex(h => h === ISSUE_ESTIMATE);
    const issueComponentsIndexes = csvHeaders.map((h, i) => h === ISSUE_COMPONENTS ? i : '').filter(String);
    const issueLabelIndexes = csvHeaders.map((h, i) => h === ISSUE_LABELS ? i : '').filter(String);

    const colorPalette = [COLOR_1, COLOR_2, COLOR_3, COLOR_4, COLOR_5];
    const backgroundColorPerParentIds = csvRows.reduce((acc, {data}) => {
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

    const updated = produce(rows, draft => {
      const taskBucketRowIndex = draft.findIndex(row => row.name === 'Task Bucket');

      const taskBucket = draft[taskBucketRowIndex];

      csvRows.forEach(({data}) => {
        taskBucket.list.push({
          id: data[issueIdIndex],
          key: data[issueKeyIndex],
          summary: data[issueSummaryIndex],
          estimate: data[issueEstimateIndex] / 28800,
          backgroundColor: backgroundColorPerParentIds[data[issueParentIdIndex]],
          components: issueComponentsIndexes.reduce((acc, curr)=> {
            const component = COMPONENT_LOOKUP[data[curr]];
            if (!component) {
              return acc;
            }

            acc.push(component)

            return acc;
          }, []),
          labels: issueLabelIndexes.reduce((acc, curr)=> {
            const label = LABEL_LOOKUP[data[curr]];
            if (!label) {
              return acc;
            }

            acc.push(label)

            return acc;
          }, []),
        });
      })
    });

    setRows(updated);
  }

  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err)
  }

  const handleOnRemoveFile = (data) => {
    console.log('---------------------------')
    console.log(data)
    console.log('---------------------------')
  }

  const handleInfoClick = (title, content) => {
    setDialog({
      open: true,
      title: title,
      content: content,
    });
  }

  const handleDialogClose = () => {
    setDialog({
      open: false,
      title: '',
      content: '',
    });
  }

  const handleGenerateReport = () => {
    const items = rows.reduce((acc, row) => {
      for(let i = 0, len = row.list.length; i < len; i++) {
        let startDate;
        if (i === 0) {
          startDate = workingDates[0];
        } else {
          startDate = acc.find(item => item.id === row.list[i-1].id).releaseDate;
        }

        const item = row.list[i];
        acc.push({
          id: item.id,
          key: item.key,
          releaseDate: addBusinessDays(startDate, item.estimate)
        });
      }

      return acc;
    }, []);

    const dateGroup  = groupBy(items, 'releaseDate');

    const html = Object.keys(dateGroup).sort((a,b) => new Date(a) - new Date(b)).map(date => {
      const tasks = dateGroup[date];

      return (<>
        <span>{format(new Date(date), 'do MMM')}:</span>
        <ol>
          {tasks.map(task => <li>{`https://altayerdigital.atlassian.net/browse/${task.key}`}</li>)}
        </ol>
      </>)
    })

    setDialog({
      open: true,
      title: 'Task Grouped By Release Date',
      content: html,
    });
  }

  const takeScreenshot = () => {
    const input =  document.getElementById('screenshot');
    html2canvas(input, {
      backgroundColor: null,
      allowTaint: true,
      scale: 2,
    }).then((canvas) => {
      // eslint-disable-next-line no-undef
      canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})]));

      setDialog({
        open: true,
        title: 'Screenshot copied to clipboard'
      });
    });
  }

  const handleSprintDaysChange = (event) => {
    setSprintDays(parseInt(event.target.value, 10));
  };

  const handleSettings = () => {
    setOpenSettings(true);
  }

  const handleSettingsClose = () => {
    setOpenSettings(false);
  };

  const handleDevelopmentRatioChange = (event, newValue) => {
    setDevelopmentRatio(newValue);
  };

  const handleAddDeveloper = () => {
    const updated = produce(rows, draft => {
      draft.splice(rows.length - 1, 0, { id: nanoid(), name: faker.name.findName(), developer: true, list: [] });
    })

    setRows(updated);
  }

  const handleRemoveDeveloper = (id) => {
    const updated = produce(rows, draft => {
      const index = draft.findIndex(todo => todo.id === id)
      if (index !== -1){
        draft.splice(index, 1);
      }
    });

    setRows(updated);
  }

  const handleDeveloperNameChange = (id, value) => {
    const updated = produce(rows, draft => {
      const index = draft.findIndex(row => row.id === id);
      draft[index].name = value;
    });

    setRows(updated);
  }

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
      <Button startIcon={<SettingsIcon />} onClick={handleSettings}>Settings</Button>
      <Button startIcon={<NotesIcon />} onClick={handleGenerateReport}>Text Report</Button>
      <Button startIcon={<PhotoCameraIcon />} onClick={takeScreenshot}>Screenshot</Button>
    </ButtonGroup>
    <Dialog onClose={handleDialogClose} open={dialog.open}>
      <DialogTitle>{dialog.title}</DialogTitle>
      <DialogContent>{dialog.content}</DialogContent>
    </Dialog>
    <Dialog onClose={handleSettingsClose} open={openSettings}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <div style={{ display: 'grid', padding: '20px' }} >
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
          <TextField label="Sprint Days" variant="outlined" type="number" value={sprintDays} onChange={handleSprintDaysChange}/>
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
          {rows.filter(r => !!r.developer).map((row) => {
            return (<div style={{ display: 'flex' }}>
              <TextField variant="outlined" value={row.name} onChange={(event) => {handleDeveloperNameChange(row.id, event.target.value)}}/>
              <IconButton aria-label="remove" onClick={() => {handleRemoveDeveloper(row.id)}}>
                <RemoveIcon />
              </IconButton>
            </div>)
          })}
          <Button startIcon={<AddIcon />} onClick={handleAddDeveloper}>Add Developer</Button>
        </div>
      </DialogContent>
    </Dialog>
    <div style={{ width: 'fit-content' }} id="screenshot">
      <div style={{ display: 'flex' }}>
        <div style={{minWidth: 180, minHeight: '50px'}}>

        </div>
        <Card style={getListStyle()}>
          {workingDates.map((date,i) => (
            <CardContent key={date} style={getItemStyle(false, {}, i < developmentDays ? COLOR_DEV_DATE : COLOR_DATE, 1)}>{format(date, 'do MMM')}</CardContent>
          ))}
        </Card>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        {rows.map((row) => {
          const total = row.list.filter(i => i.labels.indexOf('tech') === -1).reduce((acc, curr) => acc + curr.estimate, 0);

          return (<div key={row.name} style={{ display: 'flex', marginTop: '10px' }}>
            <StyledBadge badgeContent={total} color={total > developmentDays ? 'error' : 'primary'}>
              <Card style={{minWidth: 180, background: COLOR_ASSIGNEE}}>
                <CardContent>
                  {row.name}
                </CardContent>
              </Card>
            </StyledBadge>
            <Droppable droppableId={row.name} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver, row.style)}
                  {...provided.droppableProps}
                >
                  {row.list.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <StyledBadge badgeContent={item.estimate} color="primary">
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style,
                              item.backgroundColor,
                              item.estimate,
                            )}
                          >
                            <CardHeader subheader={item.key}/>
                            <CardActions disableSpacing>
                            <IconButton aria-label="add to favorites" onClick={()=> {
                              handleInfoClick(item.key, item.summary)
                            }}>
                              <InfoIcon />
                            </IconButton>
                              {[...item.components,...item.labels].map((component) => (
                                <Chip key={`${item.id}:${component}`} label={component} variant="outlined" />
                              ))}
                            </CardActions>
                          </Card>
                        </StyledBadge>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )})}

      </DragDropContext>
    </div>
    </>
  );
}

export default App;
