import * as data from "./querystring.js"

// converting JS object to a JSON string
const importingQuery = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: data.Query, }),
};

export { importingQuery };