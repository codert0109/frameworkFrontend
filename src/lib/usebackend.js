import React from 'react';
import API from './api.js';
import _ from 'lodash';

const api = new API();
let render = 0;

// This handles calls to the backend. This is a high level interface that handles a common react stuff for you. api.fetch is a low level interface that you can use if you want to handle the backend calls yourself, but it is not recommended.
export function useBackend({
  packageName,
  className,
  methodName,
  recordId = false,
  args = {},
  reload = 1,
  cache = false,
  filter = false,
}) {
  const [returnValue, setReturnValue] = React.useState(null);
  const [newArgs, setNewArgs] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      if (newArgs === null) return;

      const start = new Date().getTime();

      let URL = `/api/${packageName}/${className}/${methodName}`;

      if (recordId) {
        URL += `/${recordId}`;
      }

      let response;

      if (cache) {
        response = await api.fetchCached(URL, newArgs);
      } else {
        response = await api.fetch(URL, newArgs);
      }

      const took = new Date().getTime() - start;
      console.log(
        `${packageName}.${className}.${methodName} Data received in ${took} ms: `,
        response,
        arguments
      );

      if (filter) {
        response = filter(response);
      }

      setReturnValue(response);
    };
    fetchData();
  }, [packageName, className, methodName, newArgs, reload]);

  // This prevents duplicate calls when just a reference changes.
  if (!_.isEqual(newArgs, args)) {
    setNewArgs(args);
  }

  return returnValue;
}

export function callBackend({
  packageName,
  className,
  methodName,
  recordId,
  args,
  auth = true,
  supressDialog = false,
  cache = false,
  ttl = 1000 * 60 * 60
}) {
  let URL = `/api/${packageName}/${className}/${methodName}`;
  if (recordId) {
    URL += `/${recordId}`;
  }

  if (cache) {
    return api.fetchCached(URL, args, ttl, auth);
  }

  return api.fetch(URL, args, auth);
}


