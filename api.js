const API_BASE = 'http://api.are.na/v2';

function toParams(obj) {
    return Object
        .keys(obj)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
        .join('&');
}

function get(endpoint, data, onSuccess, onErr) {
  let url = `${API_BASE}${endpoint}?${toParams(data)}`;
  fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'GET',
  })
    .then(res => res.json())
    .then((data) => onSuccess(data))
    .catch(err => { console.log(err) });
}

function post(endpoint, data, onSuccess, onErr) {
  let url = `${API_BASE}${endpoint}`;
  fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then((data) => onSuccess(data))
    .catch(err => { throw err });
}

function del(endpoint, data, onSuccess, onErr) {
  let url = `${API_BASE}${endpoint}`;
  fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    method: 'DELETE',
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then((data) => onSuccess(data))
    .catch(err => { throw err });
}

export default {
  get: get,
  post: post
};
