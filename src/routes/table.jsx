import * as React from 'react';
import DataTable from '../components/datatable.jsx';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';

const generateLocationWhere = (location) => {
  return location?.state?.filter && Array.isArray(location.state.filter)
    ? location?.state?.filter
    : [];
};

export default function Root() {
  const { db, table } = useParams();
  const [reload, setReload] = React.useState(0);
  const location = useLocation();

  const forceReload = () => {
    setReload(reload + 1);
  };

  return (
    <DataTable
      db={db}
      table={table}
      reload={reload}
      forceReload={forceReload}
      where={generateLocationWhere(location)}
      key={`${db}.${table}.${JSON.stringify(location?.state?.filter || {})}`}
    />
  );
}
