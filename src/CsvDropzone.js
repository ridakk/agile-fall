import { produce } from 'immer';
import { nanoid } from 'nanoid';
import React, { useContext } from 'react';
import { CSVReader } from 'react-papaparse';
import LinksContext from './LinksContext';
import RowContext from './RowContext';

const COLOR_TASK = '#cbdadb';

const ISSUE_KEY = 'Issue key';
const ISSUE_ID = 'Issue id';
const ISSUE_SUMMARY = 'Summary';
const ISSUE_PARENT_ID = 'Parent id';
const ISSUE_ESTIMATE = 'Σ Original Estimate';
const ISSUE_COMPONENTS = 'Components';
const ISSUE_LABELS = 'Labels';
const ISSUE_LINK_END_TO_START = 'Outward issue link (Gantt End to Start)';
const ISSUE_LINK_END_TO_END = 'Outward issue link (Gantt End to End)';

const COMPONENT_LOOKUP = {
  'Back-End': 'be',
  'Front-End': 'fe',
  QA: 'qa',
};

const LABEL_LOOKUP = {
  technical_task: 'tech',
};

function CsvDropzone() {
  const { rows, setRows } = useContext(RowContext);
  const { links, setLinks } = useContext(LinksContext);

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

    const colorPalette = [
      '#A8E6CF',
      '#DCEDC1',
      '#FFD3B6',
      '#FFAAA5',
      '#FF8B94',
      '#EBD4CB',
      '#8CBEB2',
      '#F2EBBF',
      '#F3B562',
      '#BEBF95',
      '#8C2B59',
      '#BEBF95',
      '#F5EB67',
      '#88F7E2',
      '#FFFFCB',
    ];
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
          if (data[index] === '') {
            return;
          }

          const existingLink = draft.find(d => d.key === data[issueKeyIndex]);

          if (existingLink) {
            return;
          }

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
        });

        endToStartLinkedIndexes.forEach(index => {
          if (data[index] === '') {
            return;
          }

          const existingLink = draft.find(d => d.key === data[issueKeyIndex]);

          if (existingLink) {
            return;
          }

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
        });
      });
    });

    const updatedRows = produce(rows, draft => {
      const taskBucketRowIndex = draft.findIndex(row => row.name === 'Task Bucket');
      const taskBucket = draft[taskBucketRowIndex];

      const prepareComponents = data => {
        return issueComponentsIndexes.reduce((acc, curr) => {
          const component = COMPONENT_LOOKUP[data[curr]];
          if (!component) {
            return acc;
          }

          acc.push(component);

          return acc;
        }, []);
      };

      const prepareLabels = data => {
        return issueLabelIndexes.reduce((acc, curr) => {
          const label = LABEL_LOOKUP[data[curr]];
          if (!label) {
            return acc;
          }

          acc.push(label);

          return acc;
        }, []);
      };

      csvRows.forEach(({ data }) => {
        const id = data[issueIdIndex] || nanoid();
        const key = data[issueKeyIndex] || nanoid();
        const parentId = data[issueParentIdIndex];
        const backgroundColor = backgroundColorPerParentIds[parentId];
        const summary = data[issueSummaryIndex];
        const estimate = data[issueEstimateIndex];

        const existingBucket = draft.find(d => d.list.find(l => l.key === key));
        if (existingBucket) {
          const existingTask = existingBucket.list.find(l => l.key === key);

          existingTask.parentId = parentId;
          existingTask.summary = summary;
          existingTask.estimate = estimate / 28800;
          existingTask.backgroundColor = backgroundColor;
          existingTask.components = prepareComponents(data);
          existingTask.labels = prepareLabels(data);

          return;
        }

        taskBucket.list.push({
          id,
          key,
          parentId,
          placeholder: !id,
          summary,
          estimate: estimate / 28800,
          backgroundColor,
          components: prepareComponents(data),
          labels: prepareLabels(data),
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
    </>
  );
}

export default CsvDropzone;
