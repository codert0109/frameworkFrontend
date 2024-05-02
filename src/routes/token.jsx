import * as React from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../stores/user.js';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Token() {
  const setToken = useUserStore((state) => state.setToken);
  //const { token } = useParams();
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token');
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (token) {
      setToken(token);
      navigate('/', { replace: true });
    } else {
      setError('No token received');
    }
  }
  , []);

  return <>{error}</>;
   
}
