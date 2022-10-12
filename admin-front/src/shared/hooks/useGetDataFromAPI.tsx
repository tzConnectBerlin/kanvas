import { useNotify } from 'react-admin';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface GetDataFromAPI {
  path: string;
  notify: (value: string) => void;
  queryStr?: string;
}

const getDataFromAPI = async ({ path, queryStr, notify }: GetDataFromAPI) => {
  const baseUrl = process.env.REACT_APP_API_SERVER_BASE_URL;
  const url = queryStr ? baseUrl + path + queryStr : baseUrl + path;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`,
      },
    });

    const { data } = response.data;

    return data;
  } catch (error) {
    notify(`An error occurred while fetching data from API`);
  }
};

interface DataFromAPI<T> {
  data: T;
}

interface UseGetDataFromAPIProps {
  path: string;
  queryStr?: string;
}

export default function UseGetDataFromAPI<T>({
  path,
  queryStr,
}: UseGetDataFromAPIProps): DataFromAPI<T | undefined> {
  const notify = useNotify();
  const [dataFromAPI, setDataFromAPI] = useState<T | undefined>();

  useEffect(() => {
    getDataFromAPI({ path, notify, queryStr }).then((data) => {
      if (data) {
        setDataFromAPI(data);
      }
    });
  }, [path, notify, queryStr]);

  return { data: dataFromAPI };
}
