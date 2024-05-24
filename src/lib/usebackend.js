import React from 'react';
import API from './api.js';
import _ from 'lodash';

const api = new API();

export default function Backend(
  packageName,
  className,
  methodName,
  args,
  reload
) {
  const [returnValue, setReturnValue] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      console.log(
        `${packageName}.${className}.${methodName} Fetching data from backend... `,
        args
      );

      const response = await api.fetch(
        `/api/${packageName}/${className}/${methodName}`,
        args
      );

      console.log(
        `${packageName}.${className}.${methodName} Data received: `,
        response
      );
      setReturnValue(response);
    };
    fetchData();
  }, [packageName, className, methodName, args, reload]);

  return returnValue;
}
