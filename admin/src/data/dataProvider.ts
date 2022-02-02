import { reject } from 'lodash';
import { stringify } from 'query-string';
import { fetchUtils, DataProvider } from 'ra-core';
import { getToken } from '../auth/authUtils';

/**
 * Maps react-admin queries to a simple REST API
 *
 * This REST dialect is similar to the one of FakeRest
 *
 * @see https://github.com/marmelab/FakeRest
 *
 * @example
 *
 * getList     => GET http://my.api.url/posts?sort=['title','ASC']&range=[0, 24]
 * getOne      => GET http://my.api.url/posts/123
 * getMany     => GET http://my.api.url/posts?filter={id:[123,456,789]}
 * update      => PUT http://my.api.url/posts/123
 * create      => POST http://my.api.url/posts
 * delete      => DELETE http://my.api.url/posts/123
 *
 * @example
 *
 * import * as React from "react";
 * import { Admin, Resource } from 'react-admin';
 * import simpleRestProvider from 'ra-data-simple-rest';
 *
 * import { PostList } from './posts';
 *
 * const App = () => (
 *     <Admin dataProvider={simpleRestProvider('http://path.to.my.api/')}>
 *         <Resource name="posts" list={PostList} />
 *     </Admin>
 * );
 *
 * export default App;
 */

const dataProvider = (
  apiUrl: string,
  httpClient = fetchUtils.fetchJson,
  countHeader: string = 'Content-Range',
): DataProvider => ({

  getList: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;


    let query = {}
    if (resource === 'analytics/sales/priceVolume/snapshot') {
      query = {
        sort: JSON.stringify([field.startsWith('attributes.') ? field.slice('attributes.'.length) : field, order.toLowerCase()]),
        range: JSON.stringify([rangeStart, rangeEnd]),
        [Object.keys(params.filter)[0]]: params.filter.resolution,
      };
    } else {
      query = {
        sort: JSON.stringify([field.startsWith('attributes.') ? field.slice('attributes.'.length) : field, order.toLowerCase()]),
        range: JSON.stringify([rangeStart, rangeEnd]),
        filters: Object.keys(params.filter).length === 0 ? undefined : JSON.stringify(params.filter),
      };
    }

    const url = `${apiUrl}/${resource}?${stringify(query, {
      arrayFormat: 'bracket',
      strict: false,
      encode: false,
    })}`;
    const options =
      countHeader === 'Content-Range'
        ? {
          // Chrome doesn't return `Content-Range` header if no `Range` is provided in the request.
          headers: new Headers({
            Authorization: `Bearer ${getToken()}`,
            Range: `${resource}=${rangeStart}-${rangeEnd}`,
          }),
        }
        : {};

    return httpClient(url, options).then(({ headers, json }) => {
      
      return {
        data: json?.data,
        total: json?.count ?? 1,
    }});
  },

  getOne: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`, { headers: new Headers({ Authorization: `Bearer ${getToken()}` }) }).then(({ json }) => ({
      headers: new Headers({ Authorization: `Bearer ${getToken()}` }),
      data: json,
    })),

  getMany: (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };

    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    return httpClient(url, { headers: new Headers({ Authorization: `Bearer ${getToken()}` }) }).then(({ json }) => {

      return ({
        data: json.data, headers: new Headers({ Authorization: `Bearer ${getToken()}` })
      });
    });
  },

  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;

    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    const query = {
      sort: JSON.stringify([field, order.toLowerCase()]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      [params.target]: params.id,
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    const options =
      countHeader === 'Content-Range'
        ? {
          // Chrome doesn't return `Content-Range` header if no `Range` is provided in the request.
          headers: new Headers({
            Range: `${resource}=${rangeStart}-${rangeEnd}`,
          }),
        }
        : {};

    return httpClient(url, options).then(({ headers, json }) => {
      if (!headers.has(countHeader)) {
        throw new Error(
          `The ${countHeader} header is missing in the HTTP Response. The simple REST data provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare ${countHeader} in the Access-Control-Expose-Headers header?`,
        );
      }

      return {
        data: json.data,
        total:
          countHeader === 'Content-Range'
            ? parseInt(
              (headers.get('content-range') ?? '').split('/').pop() ?? '',
              10,
            )
            : parseInt(headers.get(countHeader.toLowerCase()) ?? ''),
      };
    });
  },

  update: async (resource, params) => {
    let updatedData: any = {};

    if (resource === 'nft') {
      updatedData = diffPreviousDataToNewData(params.previousData, params.data)
    }

    return await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'PATCH',
      body: resource === 'nft' ? toFormData(updatedData, resource) : JSON.stringify(params.data),
      headers: new Headers({ Authorization: `Bearer ${getToken()}` }),
    }).then(({ json }) => ({ data: json }))
  },

  // simple-rest doesn't handle provide an updateMany route, so we fallback to calling update n times instead
  updateMany: async (resource, params) => {
    return Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(params.data),
        }),
      ),
    ).then((responses) => ({ data: responses.map(({ json }) => json.id) }))
  },

  create: async (resource, params) => {
    if (resource === 'nft') {
      debugger
      const updatedData = diffPreviousDataToNewData({}, params.data)
      return await httpClient(`${apiUrl}/${resource}/0`, {
        method: 'PATCH',
        body: toFormData(updatedData, resource),
        headers: new Headers({ Authorization: `Bearer ${getToken()}` }),
      }).then(({ json }) => ({
        data: { ...params.data, id: json.id },
      }))

    }
    // fallback to the default implementation
    return await httpClient(`${apiUrl}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
      headers: new Headers({ 'Content-type': 'application/json', Authorization: `Bearer ${getToken()}` }),
    }).then(({ json }) => ({
      data: { ...params.data, id: json.id },
    }))
  },

  delete: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'DELETE',
      headers: new Headers({
        'Content-Type': 'text/plain',
        Authorization: `Bearer ${getToken()}`,
      }),
    }).then(({ json }) => ({ data: json })),

  // simple-rest doesn't handle filters on DELETE route, so we fallback to calling DELETE n times instead
  deleteMany: (resource, params) =>
    Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'DELETE',
          headers: new Headers({
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${getToken()}`,
          }),
        }),
      ),
    ).then((responses) => ({
      data: responses.map(({ json }) => json.id),
    })),
});

const diffPreviousDataToNewData = (previousData: any, data: any) => {
  // Attributes part
  let diff: any = {};

  const newKeys = Object.keys(data.attributes)

  for (const key of newKeys) {
    if (!previousData.attributes) {
      diff[key] = data.attributes[key]
      continue
    }
    if (JSON.stringify(previousData.attributes[key]) !== JSON.stringify(data.attributes[key])) {
      diff[key] = data.attributes[key]
    }
  }
  // File part
  if (data.hasOwnProperty('files')) {
    diff['files'] = data['files'].length ? data['files'] : [data['files']]
  }

  return diff
}

const toFormData = (data: any, resource = '') => {
  const formData = new FormData();
  const keys = Object.keys(data);

  keys.forEach((key) => {
    if (data[key]) {
      // contains .png
      if (key === 'files') {
        data[key].map((file: any) => {
          try {
            Object.defineProperty(file, 'name', {
              writable: true,
              value: 'image.png'
            });
            formData.append('files[]', file.rawFile, file.name);
          } catch (error: any) {
            console.log(error)
          }
        })
      } else {
        formData.append(key, JSON.stringify(data[key]));
      }
    }
  });

  return formData;

};

export default dataProvider;
