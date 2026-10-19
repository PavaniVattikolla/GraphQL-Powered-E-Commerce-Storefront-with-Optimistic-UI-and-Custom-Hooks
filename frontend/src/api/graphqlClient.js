// Custom lightweight GraphQL Client (no external Apollo/Relay libraries)

function getApiUrl() {
  if (typeof window !== 'undefined') {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    const host = window.location.hostname || 'localhost';
    const port = import.meta.env.VITE_API_PORT || '4000';
    return `${window.location.protocol}//${host}:${port}/graphql`;
  }
  return process.env.VITE_API_URL || 'http://localhost:4000/graphql';
}

export async function graphqlFetch(query, variables = {}) {
  const url = getApiUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Network response error: ${response.status} ${response.statusText} ${errorText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const primaryError = result.errors[0];
    const error = new Error(primaryError.message || 'GraphQL execution error');
    error.graphQLErrors = result.errors;
    error.errors = result.errors;
    throw error;
  }

  return result;
}
