const API_BASE = 'http://api.are.na/v2';

function toParams(obj) {
    return Object
        .keys(obj)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
        .join('&');
}

function get(endpoint, data) {
  let url = `${API_BASE}${endpoint}?${toParams(data)}`;
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'GET',
  })
  .then(res => res.json())
  .catch(err => { throw err });
}

function post(endpoint, data) {
  let url = `${API_BASE}${endpoint}`;
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'POST',
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .catch(err => { throw err });
}

export default {
  get: get,
  post: post
};
