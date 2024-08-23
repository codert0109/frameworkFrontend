import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBackend } from '../lib/usebackend.js';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNavigate } from 'react-router-dom';
import { DataView } from 'primereact/dataview';

export default function Search() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('value');
    if (query) {
      setSearchQuery(query);
      setSearchTrigger((prev) => prev + 1);
    }
  }, [location]);

  const [results, loading, error] = useBackend({
    packageName: 'core',
    className: 'search',
    methodName: 'search',
    args: {
      query: searchQuery,
    },
    skip: !searchQuery,
    reload: searchTrigger,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTrigger((prev) => prev + 1);
  };

  const listTemplate = (item) => {
    const [expanded, setExpanded] = useState(false);
    const [showExpand, setShowExpand] = useState(false);
    const contentRef = React.useRef(null);

    useEffect(() => {
      if (contentRef.current) {
        setShowExpand(contentRef.current.scrollHeight > 96); // 96px is 6rem (h-24)
      }
    }, [item]);

    const toggleExpand = () => {
      if (showExpand) {
        setExpanded(!expanded);
      }
    };

    return (
      <div
        className="pt-2 mb-2 mr-2 w-full bg-gray-100 p-3 rounded cursor-pointer relative"
        onClick={toggleExpand}
      >
        <div className="mb-2">
          <a
            href="#"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/${item.searchDb}/${item.searchTable}/${item.searchRecordId}`
              );
            }}
          >
            {`/${item.searchDb}/${item.searchTable}/${item.searchRecordId}`}
          </a>
        </div>
        <div
          ref={contentRef}
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-h-full' : 'max-h-24'
          }`}
        >
          <pre className="m-0 p-0 whitespace-pre-wrap">{item.searchText}</pre>
        </div>
        {showExpand && !expanded && (
          <div className="arrow-container">
            <i
              className="pi pi-chevron-down"
              style={{ fontSize: '0.8rem' }}
            ></i>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-2">
      <form onSubmit={handleSearch} className="p-fluid m-0">
        <div className="p-inputgroup">
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter your search query"
          />
          <Button type="submit" label="Search" />
        </div>
      </form>

      {(loading || results) && (
        <div className="search-results mt-0">
          <div className="flex align-items-center">
            <h2 className="mt-2">Search Results</h2>
            {loading && (
              <ProgressSpinner style={{ width: '20px', height: '20px' }} />
            )}
          </div>
          {results && results.data && results.data.results && (
            <DataView
              value={results.data.results}
              itemTemplate={listTemplate}
            />
          )}
          {loading && !results && <p>Loading...</p>}
          {error && <p>Error: {error.message}</p>}
          {results &&
            results.data &&
            results.data.results &&
            results.data.results.map((result, index) => (
              <>
                <Card
                  key={index}
                  className="mt-0 mb-1 p-0 bg-gray-100"
                  title={result._id}
                >
                  <a
                    href=""
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(
                        `/${result.searchDb}/${result.searchTable}/${result.searchRecordId}`
                      );
                    }}
                  >
                    {`/${result.searchDb}/${result.searchTable}/${result.searchRecordId}`}
                  </a>

                  <p className="m-0 p-0">
                    <pre className="m-0 p-0">
                      {
                        result.searchText
                        //{result._highlights[0].searchText || ''}
                      }
                    </pre>
                  </p>
                  <pre className="m-0 p-0">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </Card>
              </>
            ))}
        </div>
      )}
    </div>
  );
}
