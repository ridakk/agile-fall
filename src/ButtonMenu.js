import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Grid from '@material-ui/core/Grid';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import NotesIcon from '@material-ui/icons/Notes';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import SettingsIcon from '@material-ui/icons/Settings';

import { PropTypes } from 'prop-types';
import React from 'react';

function ButtonMenu({ handleSettings, handleGenerateReport, takeScreenshot, handleNewTask, handleClearState }) {
  return (
    <>
      <Grid container direction="row" justify="space-between" alignItems="center">
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
        <ButtonGroup disableElevation variant="contained" style={{ marginBottom: '20px' }}>
          <Button startIcon={<ClearIcon />} onClick={handleClearState}>
            Clear
          </Button>
        </ButtonGroup>
      </Grid>
    </>
  );
}

ButtonMenu.propTypes = {
  handleSettings: PropTypes.func,
  handleGenerateReport: PropTypes.func,
  takeScreenshot: PropTypes.func,
  handleNewTask: PropTypes.func,
  handleClearState: PropTypes.func,
};

export default ButtonMenu;
