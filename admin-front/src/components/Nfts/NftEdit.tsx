// Add authorization for allowedActions
import {
  Edit,
  SimpleForm,
  useGetOne,
  useNotify,
  useRedirect,
  useRefresh,
} from 'react-admin';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { NftAside } from './NftAside';
import { InputSelector } from './Selector/InputSelector';
import { useStyle } from './useStyle';

export const NftEdit = (props: any) => {
  const classes = useStyle();
  const concernedNft = useGetOne('nft', props.id);

  const [formFields, setFormFields] = useState<string[]>([]);

  useEffect(() => {
    if (!concernedNft.data) return;
    if (!concernedNft.data.allowedActions) return;
    setFormFields(Object.keys(concernedNft.data.allowedActions));
  }, [concernedNft]);

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`Nft updated successfully`);
    redirect('/nft');
    refresh();
  };

  const showEditForm = !!concernedNft;
  const showFormFields = formFields.length > 0;

  return (
    showEditForm && (
      <Edit
        title="Update an NFT"
        {...props}
        onSuccess={onSuccess}
        mutationMode="pessimistic"
        aside={<NftAside />}
      >
        <SimpleForm className={classes.form}>
          <Box className={classes.boxWrapper}>
            <Box flex={1}>
              <Typography
                variant="h4"
                component="h2"
                className={classes.title}
                style={{ fontFamily: 'Poppins SemiBold' }}
              >
                Update an NFT
              </Typography>
              {showFormFields &&
                formFields.map((fieldName) => (
                  <Box key={fieldName}>
                    <InputSelector
                      attributesName={fieldName}
                      label={
                        fieldName[0].toUpperCase() +
                        fieldName.replace('_', ' ').slice(1)
                      }
                      type={
                        concernedNft.data!.allowedActions[fieldName] as
                          | 'string'
                          | 'boolean'
                          | 'number'
                          | 'content_uri'
                          | 'number[]'
                          | 'votes'
                          | 'date'
                          | 'text'
                      }
                    />
                  </Box>
                ))}
            </Box>
          </Box>
        </SimpleForm>
      </Edit>
    )
  );
};
