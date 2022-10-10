import { useNotify } from 'react-admin';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface GetDataFromAPI {
  path: string;
  notify: (value: string) => void;
}

const getDataFromAPI = async ({ path, notify }: GetDataFromAPI) => {
  try {
    const response = await axios.get(
      process.env.REACT_APP_API_SERVER_BASE_URL + path,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            'KanvasAdmin - Bearer',
          )}`,
        },
      },
    );

    const { data } = response.data;

    return data;
  } catch (e) {
    notify('An error occurred while fetching data from API');
  }
};

interface DataFromAPI<T> {
  data: T;
}

export default function UseGetDataFromAPI<T>(
  path: string,
): DataFromAPI<T | undefined> {
  const notify = useNotify();
  const [dataFromAPI, setDataFromAPI] = useState<T | undefined>();

  useEffect(() => {
    getDataFromAPI({ path, notify }).then((data) => {
      if (data) {
        setDataFromAPI(data);
      }
    });
  }, []);

  return { data: dataFromAPI };
}
