import React, { useEffect } from 'react';
import API from './api.js';
import { isEqual } from 'lodash';
import { suspend, clear } from 'suspend-react';

const api = new API();
let render = 0;

const test = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 3000);
  });
};

export function useBackendSuspense({
  packageName, // The package name to call
  className, // The class name to call
  methodName, // The method name to call
  recordId = false, // recordId is optional. If it is not provided, the method will be called without a recordId.
  args = null, // arguments sent to the method
  reload = 1, // if this value changes a refresh will be forced
  cache = false, // If true, the data will be cached.
  filter = false, // This is a function that can be used to filter the data any time it is retrieved from the server, before it is stored and returned.
  clear = false, // If ever true, the data will be cleared.
  skip = false, // If true, the call will be skipped.
}) {
  if (skip) return [null, false, null];
  if (clear) {
    clear([
      packageName,
      className,
      methodName,
      recordId,
      args,
      reload,
      cache,
      filter,
      false,
      skip,
    ]);
    return [null, false, null];
  }

  return suspend(
    async () => {
      return await fetchData(
        packageName,
        className,
        methodName,
        recordId,
        args,
        reload,
        cache,
        filter,
        clear,
        skip
      );
    },
    [
      packageName,
      className,
      methodName,
      recordId,
      args,
      reload,
      cache,
      filter,
      clear,
      skip,
    ],
    { equal: isEqual, lifespan: 1000 * 60 }
  );
}

async function fetchData(
  packageName,
  className,
  methodName,
  recordId,
  args,
  reload,
  cache,
  filter,
  clear,
  skip
) {
  const start = new Date().getTime();

  let URL = `/api/${packageName}/${className}/${methodName}`;

  if (recordId) {
    URL += `/${recordId}`;
  }

  let response;

  try {
    if (cache) {
      response = await api.fetchCached(URL, args || {});
    } else {
      response = await api.fetch(URL, args || {});
    }
  } catch (e) {
    return [null, false, e];
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

  return [response, false, false];
}

function use(promise) {
  if (promise.status === 'fulfilled') {
    return promise.value;
  } else if (promise.status === 'rejected') {
    throw promise.reason;
  } else if (promise.status === 'pending') {
    throw promise;
  } else {
    promise.status = 'pending';
    promise.then(
      (result) => {
        promise.status = 'fulfilled';
        promise.value = result;
      },
      (reason) => {
        promise.status = 'rejected';
        promise.reason = reason;
      }
    );
    throw promise;
  }
}

// This handles calls to the backend. This is a high level interface that handles common react stuff for you. api.fetch is a low level interface that you can use if you want to handle the backend calls yourself, but it is not recommended.
export function useBackend({
  packageName, // The package name to call
  className, // The class name to call
  methodName, // The method name to call
  recordId = false, // recordId is optional. If it is not provided, the method will be called without a recordId.
  args = {}, // arguments sent to the method
  reload = 1, // if this value changes a refresh will be forced
  cache = false, // If true, the data will be cached.
  filter = false, // This is a function that can be used to filter the data any time it is retrieved from the server, before it is stored and returned.
  clear = false, // If ever true, the data will be cleared.
  skip = false, // If true, the call will be skipped.
}) {
  const [returnValue, setReturnValue] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
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

      setLoading(true);
      try {
        if (cache) {
          response = await api.fetchCached(URL, newArgs);
        } else {
          response = await api.fetch(URL, newArgs, true, true);
        }
      } catch (e) {
        setError(e);
        setLoading(false);
        return;
      }

      setError(false);

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
      setLoading(false);
    };
    fetchData();
  }, [packageName, className, methodName, newArgs, reload]);

  useEffect(() => {
    if (clear) {
      setReturnValue(null);
    }
  }, [clear]);

  if (skip) return [returnValue, loading, error];

  // This prevents duplicate calls when just a reference changes.
  if (!isEqual(newArgs, args)) {
    setNewArgs(args);
  }

  return [returnValue, loading, error];
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
  ttl = 1000 * 60 * 60,
}) {
  let URL = `/api/${packageName}/${className}/${methodName}`;
  if (recordId) {
    URL += `/${recordId}`;
  }

  if (cache) {
    return api.fetchCached(URL, args, ttl, auth, supressDialog);
  }

  return api.fetch(URL, args, auth, supressDialog);
}
