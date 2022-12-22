import { Link } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Chip from '@material-ui/core/Chip';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import ClearIcon from '@material-ui/icons/Clear';
import InfoIcon from '@material-ui/icons/Info';
import addDays from 'date-fns/addDays';
import format from 'date-fns/format';
import isWeekend from 'date-fns/isWeekend';
import html2canvas from 'html2canvas';
import { produce } from 'immer';
import groupBy from 'lodash/groupBy';
import shuffle from 'lodash/shuffle';
import { nanoid } from 'nanoid';
import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './App.css';
import createPersistedState from 'use-persisted-state';
import ButtonMenu from './ButtonMenu';
import CsvDropzone from './CsvDropzone';
import DevelopmentDaysContext from './DevelopmentDaysContext';
import LinksContext from './LinksContext';
import NewTaskDialog from './NewTaskDialog';
import RowContext from './RowContext';
import SettingsDialog from './SettingsDialog';
import StyledBadge from './StyledBadge';
import WorkingDatesContext from './WorkingDatesContext';

const COLOR_TASK = '#cbdadb';
const COLOR_DEV_DATE = '#99B898';
const COLOR_DATE = '#f8fbff';
const COLOR_ASSIGNEE = '#f8fbff';

const addBusinessDays = (date, count) => {
  let ctr = 1;
  let nextDate = date;

  while (ctr <= count) {
    nextDate = addDays(nextDate, 1);

    if (!isWeekend(nextDate)) {
      ctr += 1;
    }
  }

  return nextDate;
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

const usePersistedState = (key, initialState) => createPersistedState(key)(initialState);

const defaultRowData = {
  developer: false,
  list: [],
  style: { flexWrap: 'wrap' },
};

const addRowForDev = developerName => ({
  ...defaultRowData,
  id: nanoid(),
  name: developerName,
  developer: true,
});

const developerNames = [
  'Baris Ozdemir',
  'Fatih Bayar',
  'Furkan Sener',
  'Gokce Yucel',
  'Kadir Goktas',
  'Mahmut Oztemur',
  'Taskin Surucu',
  'Yunus Oksuz',
];

function App() {
  const [rows, setRows] = usePersistedState('rows', [
    ...shuffle(developerNames).map(addRowForDev),
    {
      ...defaultRowData,
      id: nanoid(),
      name: 'Task Bucket',
    },
  ]);

  const [links, setLinks] = useState([]);
  const [dialog, setDialog] = useState({ open: false, title: '', content: '' });
  const [workingDates, setWorkingDates] = useState([]);
  const [developmentDays, setDevelopmentDays] = useState(10 * 0.6);
  const [openSettings, setOpenSettings] = useState(false);
  const [openNewTask, setOpenNewTask] = useState(false);

  const rowContextValue = useMemo(() => ({ rows, setRows }), [rows]);
  const linksContextValue = useMemo(() => ({ links, setLinks }), [links]);
  const workingDatesContextValue = useMemo(() => ({ workingDates, setWorkingDates }), [workingDates]);
  const developmentDaysContextValue = useMemo(() => ({ developmentDays, setDevelopmentDays }), [developmentDays]);

  const onDragEnd = result => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    const updated = produce(rows, draft => {
      const destinationRowIndex = draft.findIndex(row => row.id === destination.droppableId);
      const sourceRowIndex = draft.findIndex(row => row.id === source.droppableId);

      const s = draft[sourceRowIndex];
      const d = draft[destinationRowIndex];

      const [removed] = s.list.splice(source.index, 1);
      d.list.splice(destination.index, 0, removed);
    });

    setRows(updated);
  };

  const handleTaskRemove = (rowId, taskIndex) => {
    const updated = produce(rows, draft => {
      const row = draft.find(r => r.id === rowId);

      row.list.splice(taskIndex, 1);
    });

    setRows(updated);
  };

  const handleInfoClick = item => {
    const linkedIssues = links.filter(link => link.key === item.key);

    const linkedIssuesByText = groupBy(linkedIssues, 'text');
    setDialog({
      open: true,
      title: item.custom ? (
        item.key
      ) : (
        <>
          <Link
            key={item.key}
            href={`https://altayerdigital.atlassian.net/issues/?jql=id%20%3D%20${item.key}`}
            underline="hover"
            target="_blank"
            rel="noopener"
          >
            {item.key}
          </Link>
          {' - '}
          <Link
            key={item.parentId}
            href={`https://altayerdigital.atlassian.net/issues/?jql=id%20%3D%20${item.parentId}`}
            underline="hover"
            target="_blank"
            rel="noopener"
            variant="subtitle2"
          >
            {'Parent Issue'}
          </Link>
        </>
      ),
      content: (
        <>
          <Typography variant="body1" gutterBottom>
            {item.summary}
          </Typography>
          {linkedIssues.length > 0 && (
            <>
              {Object.entries(linkedIssuesByText).map(([key, issues]) => {
                return (
                  <>
                    <Typography variant="subtitle2">{key}:</Typography>
                    {issues.map(link => (
                      <Link
                        key={link.issue}
                        href={`https://altayerdigital.atlassian.net/browse/${link.issue}`}
                        underline="hover"
                        target="_blank"
                        rel="noopener"
                      >
                        {link.issue}
                      </Link>
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
    const items = rows
      .filter(r => r.name !== 'Task Bucket')
      .reduce((acc, row) => {
        for (let i = 0, len = row.list.length; i < len; i++) {
          let date;
          if (i === 0) {
            [date] = workingDates;
          } else {
            date = acc.find(item => item.id === row.list[i - 1].id).releaseDate;
          }

          const item = row.list[i];

          if (!item.placeholder) {
            acc.push({
              id: item.id,
              key: item.key,
              releaseDate: addBusinessDays(date, item.estimate),
            });
          }
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

  const handleSettings = () => {
    setOpenSettings(true);
  };

  const handleSettingsClose = () => {
    setOpenSettings(false);
  };

  const handleNewTask = () => {
    setOpenNewTask(true);
  };

  const handleNewTaskClose = () => {
    setOpenNewTask(false);
  };

  const handleClearState = () => {
    const iAmSure = window.confirm('are you sure?');
    if (!iAmSure) {
      return;
    }

    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <LinksContext.Provider value={linksContextValue}>
        <RowContext.Provider value={rowContextValue}>
          <CsvDropzone />
        </RowContext.Provider>
      </LinksContext.Provider>
      <ButtonMenu
        handleSettings={handleSettings}
        handleGenerateReport={handleGenerateReport}
        takeScreenshot={takeScreenshot}
        handleNewTask={handleNewTask}
        handleClearState={handleClearState}
      />
      <Dialog onClose={handleDialogClose} open={dialog.open}>
        <DialogTitle>{dialog.title}</DialogTitle>
        <DialogContent>{dialog.content}</DialogContent>
      </Dialog>
      <WorkingDatesContext.Provider value={workingDatesContextValue}>
        <DevelopmentDaysContext.Provider value={developmentDaysContextValue}>
          <RowContext.Provider value={rowContextValue}>
            <SettingsDialog onClose={handleSettingsClose} open={openSettings} />
          </RowContext.Provider>
        </DevelopmentDaysContext.Provider>
      </WorkingDatesContext.Provider>
      <RowContext.Provider value={rowContextValue}>
        <NewTaskDialog onClose={handleNewTaskClose} open={openNewTask} />
      </RowContext.Provider>
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
              <div key={row.id} style={{ display: 'flex', marginTop: '10px' }}>
                <StyledBadge badgeContent={total} color={total > developmentDays ? 'error' : 'primary'}>
                  <Card style={{ minWidth: 180, background: COLOR_ASSIGNEE }}>
                    <CardContent>{row.name}</CardContent>
                  </Card>
                </StyledBadge>
                <Droppable droppableId={row.id} direction="horizontal">
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
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleTaskRemove(row.id, index);
                                    }}
                                  >
                                    <ClearIcon />
                                  </IconButton>
                                  {!item.placeholder && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        handleInfoClick(item);
                                      }}
                                    >
                                      <InfoIcon />
                                    </IconButton>
                                  )}
                                  {!item.placeholder &&
                                    [...item.components, ...item.labels].map(component => (
                                      <Chip
                                        key={`${item.id}:${component}`}
                                        label={component}
                                        variant="outlined"
                                        size="small"
                                      />
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
