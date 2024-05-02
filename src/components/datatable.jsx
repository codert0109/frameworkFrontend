import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import CreateRecordButton from './buttons/createrecord.jsx';
import Record from './record.jsx';
import useUserStore from '../stores/user.js';
import API from '../lib/api.js';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from './util.js';
import { Interweave } from 'interweave';
import './datatable.css';

const api = new API();

const defaultLazyState = {
  offset: 0,
  limit: 5,
  page: 1,
  sortField: 'id',
  sortOrder: 1,
  filters: {},
};

export default function DataTableExtended({
  db,
  table,
  closeOnCreate = false,
  where = [],
  reload,
  forceReload,
}) {
  const [name, setName] = useState('');
  const [data, setData] = useState([]);
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState({
    data: true,
    columns: true,
  });
  const [error, setError] = useState(null);
  //const [reload, setReload] = useState(1);
  const [lazyState, setlazyState] = useState({
    offset: 0,
    limit: 5,
    page: 1,
    sortField: 'id',
    sortOrder: 1,
    filters: {},
  });
  const [previousTable, setPreviousTable] = useState(table);

  console.log('lazyState', lazyState);

  const navigate = useNavigate();
  const location = useLocation();

  const allLoaded = Object.values(loading).every((v) => !v);

  console.log('props', db, table, reload, where, location);

  useEffect(() => {
    const fetchSchema = async () => {
      setError(null);
      //try {
      const response = await api.fetchCached(
        `/api/db/${db}/${table}/getSchema`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setName(response.data.name);
      setColumns(response.data.schema);
      setlazyState((prevLazyState) => ({
        offset: 0,
        limit: 5,
        page: 1,
        sortField: 'id',
        sortOrder: 1,
        filters: Object.keys(response.data.schema).reduce((acc, key) => {
          acc[key] = { value: '', matchMode: 'contains' };
          return acc;
        }, {}),
      }));
      setLoading((prevLoading) => ({ ...prevLoading, columns: false }));
    };
    fetchSchema();
  }, [db, table]);

  useEffect(() => {
    const fetchData = async () => {
      if (previousTable !== table) {
        setPreviousTable(table);
        setlazyState(defaultLazyState);
        return;
      }
      const tempWhere = [...where];

      if (
        location?.state?.filter &&
        Array.isArray(location?.state?.filter) &&
        location.state.filter.length > 0
      ) {
        for (const filter of location.state.filter) {
          tempWhere.push(filter);
        }
      }
      console.log(columns);
      for (const [key, value] of Object.entries(lazyState.filters)) {
        if (value.value) {
          const columnName =
            columns[key].tableAlias + '.' + columns[key].actualColumnName;
          switch (value.matchMode) {
            case 'startsWith':
              tempWhere.push([columnName, 'like', `${value.value}%`]);
              break;
            case 'endsWith':
              tempWhere.push([columnName, 'like', `%${value.value}`]);
              break;
            case 'contains':
              tempWhere.push([columnName, 'like', `%${value.value}%`]);
              break;
            case 'notContains':
              tempWhere.push([columnName, 'not like', `%${value.value}%`]);
              break;
            case 'equals':
              tempWhere.push([columnName, '=', value.value]);
              break;
            case 'notEquals':
              tempWhere.push([columnName, '!=', value.value]);
              break;
            default:
              throw new Error('Unknown matchMode');
          }
        }
      }

      try {
        const response = await api.fetch(`/api/db/${db}/${table}/getRows`, {
          where: tempWhere,
          sortField: lazyState.sortField,
          sortOrder: lazyState.sortOrder > 0 ? 'DESC' : 'ASC',
          limit: lazyState.limit,
          offset: lazyState.offset,
          returnCount: true,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setData(response.data.rows);
        setRows(response.data.count);
        console.log('response', response.data);
      } catch (e) {
        setError(e.message);
      } finally {
        // nothing
        setLoading((prevLoading) => ({ ...prevLoading, data: false }));
      }
    };

    fetchData();
  }, [db, table, reload, location, lazyState]);

  if (error)
    return (
      <>
        <p>Error loading data: {error}</p>
      </>
    );

  if (!allLoaded)
    return (
      <>
        <p>Loading...</p>
      </>
    );

  const bodyTemplate = (data, props) => {
    const columnValue = data[props.field];
    if (props.columnType === 'datetime') {
      return (
        <div style={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(columnValue)}
        </div>
      );
    }
    if (props.fieldType === 'textArea') {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{columnValue}</div>;
    }
    if (props.listStyle == 'nowrap') {
      return <div style={{ whiteSpace: 'nowrap' }}>{columnValue}</div>;
    }

    if (props.fieldType === 'html') {
      return <pre>{columnValue}</pre>;
    }

    return <>{columnValue}</>;
  };

  const onLazyStateChange = (e) => {
    setlazyState((prevLazyState) => {
      return {
        ...prevLazyState,
        offset: e.first,
        limit: e.rows,
        sortField: e.sortField,
        sortOrder: e.sortOrder,
        filters: e.filters,
      };
    });
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <span className="text-xl text-900 font-bold">
          {location?.state?.tableHeader || name}
        </span>
      </div>
      <CreateRecordButton
        db={db}
        table={table}
        header={'Create ' + name}
        onClose={() => {
          //setReload((prevReload) => prevReload + 1);
          forceReload();
        }}
        where={where}
        closeOnCreate={closeOnCreate}
      />
    </div>
  );

  return (
    <>
      <DataTable
        value={data}
        header={header}
        tableStyle={{ minWidth: '50rem' }}
        onRowClick={(e) => {
          console.log(e.data);
          navigate(`/${db}/${table}/${e.data.id}`);
        }}
        lazy
        filterDisplay="row"
        paginator
        rows={lazyState.limit}
        first={lazyState.offset}
        sortField={lazyState.sortField}
        filters={lazyState.filters}
        sortOrder={lazyState.sortOrder}
        onPage={onLazyStateChange}
        onSort={onLazyStateChange}
        onFilter={onLazyStateChange}
        totalRecords={rows}
        // all of this is buggy/doesn't work in react prime. :(
        //reorderIndicatorUpIcon="pi pi-sort-alpha-down"
        //reorderIndicatorDownIcon={<>"pi pi-sort-alpha-down-alt"</>}
      >
        {Object.entries(columns)
          .sort(
            ([, settingsA], [, settingsB]) => settingsA.order - settingsB.order
          )
          .map(([columnId, settings]) => {
            if (settings.join) return; // Dont show the column that contains a forgien key
            if (settings.hidden) return;
            if (settings.hiddenList) return;

            const bodyProps = {
              body: (data) =>
                bodyTemplate(data, { ...settings, field: columnId }),
            };

            return (
              <Column
                key={columnId}
                field={columnId}
                header={settings.friendlyName}
                {...bodyProps}
                sortable
                filter
              />
            );
          })}
      </DataTable>
    </>
  );
}
