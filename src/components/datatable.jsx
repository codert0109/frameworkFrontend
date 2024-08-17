import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import CreateRecordButton from './buttons/createrecord.jsx';

import { useBackend, useBackendSuspense } from '../lib/usebackend.js';

import fields from './fields';

import './datatable.css';

const defaultLazyState = {
  offset: 0,
  limit: 10,
  page: 1,
  sortField: 'id',
  sortOrder: 1,
  filters: {},
};

// generate a where from the lazyState
const generateLazyWhere = (filters, schema) => {
  const tempWhere = [];

  if (schema && schema.data && schema.data.schema) {
    for (const [key, value] of Object.entries(filters)) {
      if (
        value.value !== undefined &&
        value.value !== '' &&
        value.value !== null
      ) {
        const columnName =
          schema.data.schema[key].tableAlias +
          '.' +
          schema.data.schema[key].actualColumnName;
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
  }

  return tempWhere;
};

export default function DataTableExtended({
  db,
  table,
  closeOnCreate = false,
  where = [],
  reload,
  forceReload,
  child = false, // is this a child table?
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const [lazyState, setLazyState] = useState(defaultLazyState);

  const [schema] = useBackendSuspense({
    packageName: db,
    className: table,
    methodName: 'schemaGet',
    cache: true,
  });

  const [rowsGetArgs, setRowGetArgs] = useState({
    where: [...where, ...generateLazyWhere(lazyState.filters, schema)],
    sortField: lazyState.sortField,
    sortOrder: lazyState.sortOrder > 0 ? 'DESC' : 'ASC',
    limit: lazyState.limit,
    offset: lazyState.offset,
    returnCount: true,
  });

  const [rows] = useBackend({
    packageName: db,
    className: table,
    methodName: 'rowsGet',
    args: rowsGetArgs,
    reload,
  });

  useEffect(() => {
    setRowGetArgs((prevRowsGetArgs) => {
      return {
        ...prevRowsGetArgs,
        where: [...where, ...generateLazyWhere(lazyState.filters, schema)],
      };
    });
  }, [where]);

  useEffect(() => {
    if (!schema) return;

    setLazyState((prevLazyState) => ({
      ...prevLazyState,
      filters: Object.keys(schema.data.schema).reduce((acc, key) => {
        acc[key] = { value: '', matchMode: 'contains' };
        return acc;
      }, {}),
    }));
  }, [schema]);

  useEffect(() => {
    // update the state for the server call
    setRowGetArgs((prevRowsGetArgs) => {
      return {
        ...prevRowsGetArgs,
        offset: lazyState.offset,
        limit: lazyState.limit,
        sortField: lazyState.sortField,
        sortOrder: lazyState.sortOrder > 0 ? 'DESC' : 'ASC',
        returnCount: true,
        where: [...where, ...generateLazyWhere(lazyState.filters, schema)],
      };
    });
  }, [lazyState]);

  const onLazyStateChange = (e) => {
    // update the state for the datatable component
    setLazyState((prevLazyState) => {
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

  const onFilterElementChange = (columnId, value, matchMode) => {
    setLazyState((prevLazyState) => {
      return {
        ...prevLazyState,
        filters: {
          ...prevLazyState.filters,
          [columnId]: {
            value,
            matchMode,
          },
        },
      };
    });
  };

  const header = (
    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <span className="text-xl text-900 font-bold">
          {location?.state?.tableHeader || schema?.data?.name}
        </span>
      </div>
      <div>
        <CreateRecordButton
          db={db}
          table={table}
          disabled={schema?.data?.readOnly}
          header={'Create ' + schema?.data?.name}
          onClose={() => {
            forceReload();
          }}
          where={child ? where : []} // we pass in the where clause if this is a child table so we can prefill the foreign keys
          closeOnCreate={closeOnCreate}
        />
        <Button
          onClick={() => {
            forceReload();
          }}
          className="mx-1"
          icon="pi pi-refresh"
          tooltip="Refresh data"
        />
      </div>
    </div>
  );

  return (
    <>
      <DataTable
        value={rows?.data?.rows || []}
        header={header}
        tableStyle={{ minWidth: '50rem' }}
        onRowClick={(e) => {
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
        totalRecords={rows?.data?.count || 0}
      >
        {Object.entries(schema?.data?.schema || {})
          .sort(
            ([, settingsA], [, settingsB]) => settingsA.order - settingsB.order
          )
          .map(([columnId, settings]) => {
            if (settings.join) return; // Dont show the column that contains a forgien key
            if (settings.hidden) return;
            if (settings.hiddenList) return;

            const columnProps = {
              filter: true,
              sortable: true,
              header: settings.friendlyName,
            };

            // filter
            if (fields[settings.fieldType]?.filter) {
              const Filter = fields[settings.fieldType]?.filter;
              columnProps.filterElement = (
                <Filter
                  value={lazyState.filters[columnId]?.value || ''}
                  onFilterElementChange={onFilterElementChange}
                  columnId={columnId}
                />
              );

              if (Filter.showFilterMenu !== undefined) {
                columnProps.showFilterMenu = Filter.showFilterMenu;
              }

              if (Filter.showClearButton !== undefined) {
                columnProps.showClearButton = Filter.showClearButton;
              }
            }

            // read
            if (fields[settings.fieldType]?.read) {
              const Read = fields[settings.fieldType].read;
              columnProps.body = (data) =>
                Read({
                  value: data[columnId],
                  valueFriendly: data[columnId],
                  settings,
                });
            }

            return <Column key={columnId} field={columnId} {...columnProps} />;
          })}
      </DataTable>
    </>
  );
}
