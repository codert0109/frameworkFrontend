// api.js
import useUserStore from '../stores/user.js';

let globalCache = {};
class API {
  constructor() {}

  async waitForAuthentication() {
    const isAuthenticated = useUserStore.getState().isAuthenticated();
    if (isAuthenticated) return;

    console.log('Not authenticated, waiting for authentication...');
    this.clearCache();

    return new Promise((resolve) => {
      const unsubscribe = useUserStore.subscribe(
        (store) => {
          if (store.authenticated) {
            unsubscribe();
            resolve();
          }
        },
        (state) => state.authenticated
      );
    });
  }

  /**
   * Adds a timeout to a Promise
   * @param {Promise} promise - The Promise to add a timeout to
   * @param {number} timeoutMs - The timeout in milliseconds
   * @returns {Promise} - A Promise that rejects if the timeout is reached
   */
  timeoutPromise(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      ),
    ]);
  }

  /**
   * Fetch data from the API
   * @param {string} url - The URL to fetch data from
   * @param {object} body - The body of the request
   * @param {boolean} auth - Whether to wait for authentication
   * @param {boolean} suppressDialog - Whether to suppress error dialogs
   * @param {number} timeoutMs - The timeout in milliseconds
   * @returns {Promise} - A promise that resolves to the fetched data
   * @throws {Error} - Throws an error if the fetch fails or times out
   */
  async fetch(
    url,
    body = {},
    auth = true,
    suppressDialog = false,
    timeoutMs = 30000
  ) {
    while (true) {
      if (auth) {
        await this.waitForAuthentication();
      }

      const token = useUserStore.getState().token;

      try {
        const response = await this.timeoutPromise(
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }),
          timeoutMs
        );

        if (response.status === 401) {
          console.log('Got 401 for URL: ', url);
          useUserStore.getState().logout();
          this.clearCache();
          console.log(`Received 401, Waiting for re-authentication... `);
          continue;
        }

        if (response.status === 403) {
          throw new Error(
            'Access Denied: You do not have permission to access this resource.'
          );
        }

        if (response.status !== 200) {
          console.log('Failed to fetch URL: ', url);
          const json = await response.json();
          if (json.error) {
            if (!suppressDialog)
              useUserStore.getState().setErrorMessage(json.error);
            throw new Error(json.error);
          }
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.messages) {
          for (const message of data.messages) {
            useUserStore.getState().toast(message);
          }
        }

        if (globalCache[url]) {
          delete globalCache[url];
        }

        return {
          ok: response.ok,
          data: data.data,
          messages: data.messages,
        };
      } catch (error) {
        if (error.message === 'Request timed out') {
          throw new Error(`API call timed out after ${timeoutMs}ms`);
        }
        throw new Error(`API call failed: ${error.message}`);
      }
    }
  }

  getCached(url, ttl) {
    const cachedItem = globalCache[url];
    if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
      console.log('Cache Hit!', url, cachedItem.data);
      return JSON.parse(JSON.stringify(cachedItem.data));
    }
    console.log('Cache Miss!', url);
    return null;
  }

  updateCache(url, data) {
    globalCache[url] = {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
    };
  }

  /**
   * Fetch data from the API with caching
   * @param {string} url - The URL to fetch data from
   * @param {object} options - The options for the request
   * @param {number} ttl - The time-to-live for the cache in milliseconds
   * @param {boolean} auth - Whether to wait for authentication
   * @param {boolean} suppressDialog - Whether to suppress error dialogs
   * @param {number} timeoutMs - The timeout in milliseconds
   * @returns {Promise} - A promise that resolves to the fetched or cached data
   * @throws {Error} - Throws an error if the fetch fails or times out
   */
  async fetchCached(
    url,
    options = {},
    ttl = 1000 * 60 * 60,
    auth = true,
    suppressDialog = false,
    timeoutMs = 30000
  ) {
    const cachedData = this.getCached(url, ttl);
    if (cachedData) {
      console.log('Cache hit', url);
      return Promise.resolve(cachedData);
    }

    console.log('Cache miss', url);

    const response = await this.fetch(
      url,
      options,
      auth,
      suppressDialog,
      timeoutMs
    );

    if (response.ok) {
      this.updateCache(url, response);
      return response;
    } else {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
  }

  clearCache() {
    console.log('Clearing cache', this);
    globalCache = {};
  }

  /**
   * Uploads multiple files to the specified URL
   * @param {string} url - The URL to upload the files to
   * @param {FormData} formData - The form data containing the files and additional information
   * @param {boolean} auth - Whether to use authentication
   * @param {boolean} suppressDialog - Whether to suppress error dialogs
   * @returns {Promise<Object>} The server response
   */
  async uploadFiles(url, formData, auth = true, suppressDialog = false) {
    if (auth) {
      await this.waitForAuthentication();
    }

    const token = useUserStore.getState().token;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          useUserStore.getState().logout();
          this.clearCache();
          throw new Error('Authentication required');
        }

        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      const data = await response.json();

      return {
        ok: response.ok,
        data: data.data,
        messages: data.messages,
      };
    } catch (error) {
      if (!suppressDialog) {
        useUserStore.getState().setErrorMessage(error.message);
      }
      throw error;
    }
  }

  /**
   * Initiates a file download from the specified URL using the bearer token for authentication
   * @param {string} url - The URL to download the file from
   * @param {string} filename - The suggested filename for the download (optional)
   * @throws {Error} If the download fails or the user is not authenticated
   */
  async downloadFile(url, filename = null) {
    await this.waitForAuthentication();
    const token = useUserStore.getState().token;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          useUserStore.getState().logout();
          this.clearCache();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the filename from the Content-Disposition header if not provided
      if (!filename) {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
      }

      // If filename is still not available, use a default name
      filename = filename || 'download';

      // Create a Blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the Blob
      const windowUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = windowUrl;
      a.download = filename;

      // Append the anchor to the body, click it, and remove it
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(windowUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      useUserStore.getState().setErrorMessage(error.message);
      throw error;
    }
  }
}

export default API;
