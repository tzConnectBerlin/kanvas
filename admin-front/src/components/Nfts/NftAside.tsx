import { useEffect, useState } from 'react';
import { Record } from 'react-admin';
import axios from 'axios';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { FieldSelector } from './Selector/FieldSelector';
import { renderContent } from './renderContent';

export const NftAside = ({ ...props }) => {
  const [formKeys, setFormKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!props.record) return;
    if (!props.record.attributes) return;

    setFormKeys(Object.keys(props.record.attributes));
  }, [props.record]);

  const [categories, setCategories] = useState<Record[]>([]);
  const [categoriesCalled, setCategoriesCalled] = useState<boolean>(false);
  const [attributesTypes, setAttributesTypes] = useState();

  const getAttributesTypes = () => {
    axios
      .get(process.env.REACT_APP_API_SERVER_BASE_URL + '/nft/attributes', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            'KanvasAdmin - Bearer',
          )}`,
        },
      })
      .then((response: any) => {
        setAttributesTypes(response.data);
      })
      .catch((error: any) => {
        console.log(error);
      });
  };

  const getAssignableCategories = () => {
    axios
      .get(
        process.env.REACT_APP_API_SERVER_BASE_URL + '/categories/assignable',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              'KanvasAdmin - Bearer',
            )}`,
          },
        },
      )
      .then((response: any) => {
        setCategories(
          response.data.data.map((cat: any) =>
            props.record.attributes.categories.indexOf(cat.id) !== -1
              ? cat
              : undefined,
          ),
        );
      })
      .catch((error: any) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (!props.record) return;
    if (!props.record.attributes) return;

    if (categories.length > 0 || categoriesCalled) return;
    setCategoriesCalled(true);
    getAssignableCategories();
  }, [props.record]);

  useEffect(() => {
    getAttributesTypes();
  }, []);

  return (
    <Paper style={{ width: 750, marginLeft: '1em' }}>
      <div style={{ margin: '1em' }}>
        <Typography variant="h6" style={{ fontFamily: 'Poppins SemiBold' }}>
          Preview your nft
        </Typography>
        <Typography
          variant="body2"
          style={{ fontFamily: 'Poppins Medium', color: '#c4c4c4' }}
        >
          Representation of the Nft
        </Typography>
        <Stack
          direction="row"
          sx={{
            position: 'relative',
            alignItems: 'flex-end',
            margin: '2em',
            height: '100%',
            flexGrow: 1,
          }}
          spacing={3}
        >
          <Box
            sx={{
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            {renderContent(
              '80%',
              '80%',
              props.record?.attributes.artifact?.uri,
            )}
          </Box>

          <Stack direction="column" sx={{ flexStart: 'end', width: '60%' }}>
            {formKeys.length > 0 &&
              attributesTypes &&
              formKeys.map((key) => {
                const label =
                  key[0].toUpperCase() + key.replace('_', ' ').slice(1);

                return (
                  <FieldSelector
                    key={key}
                    attributesName={key}
                    label={label}
                    type={
                      attributesTypes[key] as
                        | 'string'
                        | 'boolean'
                        | 'number'
                        | 'content'
                        | 'number[]'
                        | 'votes'
                        | 'date'
                        | 'text'
                    }
                    record={props.record.attributes}
                    numberValueArray={
                      key === 'categories'
                        ? categories.map((category: Record) => category?.name)
                        : []
                    }
                    getPriceWithCurrency={
                      label === 'Price' ? props.getPriceWithCurrency : undefined
                    }
                  />
                );
              })}
          </Stack>
        </Stack>
      </div>
    </Paper>
  );
};
