import * as React from 'react';
import Record from '../components/record.jsx';
import Related from '../components/related.jsx';

import { Routes, Route, useParams } from 'react-router-dom';

export default function ViewRecord() {
  const { db, table, recordId } = useParams();
  const [reload, setReload] = React.useState(0);

  const forceReload = () => {
    setReload(reload + 1);
  };

  return (
    <>
      <React.Suspense fallback={<div></div>}>
        <Record
          db={db}
          table={table}
          recordId={parseInt(recordId)}
          reload={reload}
          forceReload={forceReload}
          showHeader={true}
        />
        <React.Suspense fallback={<div></div>}>
          <Related
            db={db}
            table={table}
            recordId={parseInt(recordId)}
            reload={reload}
            forceReload={forceReload}
          />
        </React.Suspense>
      </React.Suspense>
    </>
  );
}
