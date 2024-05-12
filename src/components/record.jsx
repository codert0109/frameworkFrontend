import React, { useState, useEffect } from 'react';

import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tooltip } from 'primereact/tooltip';

import API from '../lib/api.js';
import { useNavigate } from 'react-router-dom';
import ConfirmButton from './buttons/confirmbutton.jsx';
import ActionButton from './buttons/actionbutton.jsx';

import { formatDateTime, unFormatDateTime } from './util.js';
import { Interweave } from 'interweave';

import './record.css';

const api = new API();

export default function Record({
  db,
  table,
  recordId,
  onClose,
  closeOnCreate = false,
  where = [],
  reload,
  forceReload,
}) {
  const [name, setName] = useState('');
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();
  const [buttons, setButtons] = useState([]);

  console.log('rendering resord.jsx. props', formData, where);

  let newRecord = false;

  if (!recordId) {
    newRecord = true;
  }

  useEffect(() => {
    const fetchActions = async () => {
      const response = await api.fetchCached(
        `/api/db/${db}/${table}/getActions`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setButtons(response.data);
    };
    fetchActions();

    const fetchSchema = async () => {
      const response = await api.fetchCached(
        `/api/db/${db}/${table}/schemaGet`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setName(response.data.name); // Set the name of the table (used in the title of the page
      return response.data.schema; // Return the schema data for further processing
    };

    const fetchRecord = async () => {
      const response = await api.fetch(
        `/api/db/${db}/${table}/recordGet/${recordId}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.data; // Return the record data for further processing
    };

    const loadData = async () => {
      try {
        const [schema, recordData] = await Promise.all([
          fetchSchema(),
          newRecord ? Promise.resolve(null) : fetchRecord(), // Fetch record only if it's not a new record
        ]);

        setColumns(schema);

        if (recordData) {
          // Apply datetime formatting if necessary
          Object.entries(schema).forEach(([columnId, settings]) => {
            if (settings.columnType === 'datetime') {
              recordData[columnId] = formatDateTime(recordData[columnId]);
            }
          });

          setFormData(recordData);
        }

        if (newRecord) {
          for (const whereClause of where) {
            setFormData((formData) => ({
              ...formData,
              ...whereClause,
            }));
          }
        }
      } catch (err) {
        // Centralized error handling for either fetchSchema or fetchRecord
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [db, table, recordId, reload]);

  // Fetch the dropdown options for each dropdown field
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      const done = {}; // Sometimes the same join is used in multiple columns, so we only need to fetch it once
      for (const [columnId, settings] of Object.entries(columns)) {
        if (settings.join && !done[columnId]) {
          try {
            const response = await api.fetchCached(
              `/api/db/${settings.joinDb}/${settings.join}/rowsGet`
            );

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            response.data.rows.push({ id: null, name: 'None' });

            setDropdownOptions((prevOptions) => ({
              ...prevOptions,
              [columnId]: response.data.rows,
            }));
            done[columnId] = true;
          } catch (err) {
            console.error('Error fetching dropdown options:', err);
          }
        }
      }

      if (newRecord && columns.id) {
        const temp = {};
        for (const [columnId, settings] of Object.entries(columns)) {
          if (settings.defaultValue) {
            temp[columnId] = settings.defaultValue;
          }
        }
        //setFormData(temp);
        setFormData((formData) => ({ ...formData, ...temp }));
        console.log('new record sent!', temp);
        return;
      }
    };

    if (Object.keys(columns).length) {
      fetchDropdownOptions();
    }
  }, [columns]);

  const handleChange = (columnId, value) => {
    setFormData({
      ...formData,
      [columnId]: value,
    });
  };

  // Create a record
  const handleSubmit = async (params) => {
    setError(null);

    const postData = { ...formData };

    Object.entries(columns).forEach(([columnId, settings]) => {
      if (settings.columnType === 'datetime') {
        postData[columnId] = unFormatDateTime(formData[columnId]);
      }
    });

    try {
      const response = await api.fetch(`/api/db/${db}/${table}/recordCreate`, {
        data: postData,
      });

      if (!response.ok) {
        throw new Error('Server response was not ok', response);
      }

      if (onClose) {
        onClose();
      }

      if (!closeOnCreate) {
        navigate(`/${db}/${table}/${response.data.id}`);
      } else {
        if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      // nothing
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const renderInputField = (columnId, settings) => {
    if (settings.readOnly) {
      return <>{formData[columnId]}</>;
    }
    if (settings.join) {
      // The field is a reference to another table
      return (
        <Dropdown
          value={formData[columnId]}
          onChange={(e) => {
            handleChange(columnId, e.value);
          }}
          optionLabel={settings.friendlyColumnName}
          optionValue="id"
          options={dropdownOptions[columnId]}
          className="w-full md:w-14rem"
          size={settings.fieldWidth}
          key={columnId}
        />
      );
    }
    switch (settings.fieldType) {
      case 'select':
        return (
          <Dropdown
            value={formData[columnId]}
            onChange={(e) => {
              handleChange(columnId, e.value);
            }}
            options={settings.options.map((item) => ({
              label: item,
              value: item,
            }))}
            className="w-full md:w-14rem"
            size={settings.fieldWidth}
            key={columnId}
          />
        );
      case 'textArea':
      case 'html':
        return (
          <InputTextarea
            id={columnId}
            name={columnId}
            placeholder={settings.helpText}
            onChange={(e) => handleChange(columnId, e.target.value)}
            value={formData[columnId]}
            key={columnId}
            style={{ height: '100px' }}
          />
        );
      default:
        // 'text' or other types
        return (
          <InputText
            id={columnId}
            name={columnId}
            placeholder={settings.helpText}
            onChange={(e) => handleChange(columnId, e.target.value)}
            value={formData[columnId]}
            size={settings.fieldWidth}
            key={columnId}
          />
        );
    }
  };

  return (
    <>
      <h2>{newRecord ? '' : 'Update ' + name}</h2>
      <Tooltip target=".tooltip" />
      <form onSubmit={(e) => e.preventDefault()}>
        {Object.entries(columns).map(([columnId, settings]) => {
          if (settings.table != table) return;
          if (settings.primaryKey) return;
          if (settings.hidden) return;
          if (settings.hiddenRecord) return;
          if (settings.hiddenCreate && newRecord) return;
          if (settings.hiddenUpdate && !newRecord) return;
          if (
            where &&
            where.some((obj) => obj.hasOwnProperty(columnId)) &&
            newRecord
          )
            return; // Dont show the column that contains a forgien key that was supplied for new records

          return (
            <div className="field grid" key={columnId}>
              <label
                htmlFor={columnId}
                className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"
              >
                <div
                  data-pr-tooltip={settings.helpText}
                  data-pr-position="top"
                  className="tooltip"
                >
                  {settings.friendlyName || columnId}
                </div>
              </label>
              <div className="col-12 md:col-10">
                {renderInputField(columnId, settings)}
                {settings.join && (
                  <i
                    className="ml-3 pi pi-external-link tooltip"
                    style={{ color: 'var(--primary-color)' }}
                    onClick={() => {
                      navigate(`/${db}/${settings.join}/${formData[columnId]}`);
                    }}
                    data-pr-tooltip="View the related record"
                  ></i>
                )}
              </div>
            </div>
          );
        })}
        <div className="field grid" key="submitbutton">
          <div className="col-12 mb-2 md:col-2 md:mb-0 nowrap align-content-end formLabel"></div>
          <div className="col-12 md:col-10">
            {newRecord && (
              <>
                <Button
                  type="submit"
                  label="Create"
                  tooltip="Create the record"
                  tooltipOptions={{ position: 'top' }}
                  className="mr-1 mb-1"
                  onClick={() => {
                    handleSubmit({ close: false });
                  }}
                />
                <Button
                  type="button"
                  label="Cancel"
                  tooltip="Cancel and go back"
                  tooltipOptions={{ position: 'top' }}
                  severity="secondary"
                  className="mr-1 mb-1"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    }
                  }}
                />
              </>
            )}
            {!newRecord &&
              buttons.map((button) => {
                return (
                  <ActionButton
                    button={button}
                    key={button.label}
                    db={db}
                    table={table}
                    recordId={recordId}
                    forceReload={forceReload}
                    reload={reload}
                    formData={formData}
                    columns={columns}
                  />
                );
              })}
          </div>
        </div>
      </form>
    </>
  );
}
