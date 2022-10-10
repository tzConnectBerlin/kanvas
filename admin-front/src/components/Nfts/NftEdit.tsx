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
import { FormFieldInputType } from './Selector/types';
import UseGetPriceWithCurrency, {
  getCurrencySymbolDataForCurrency,
} from 'shared/hooks/useGetPriceWithCurrency';

export const NftEdit = (props: any) => {
  const notify = useNotify();
  const classes = useStyle();
  const concernedNft = useGetOne('nft', props.id);

  const [formFields, setFormFields] = useState<string[]>([]);
  const { baseCurrency, getPriceWithCurrency } = UseGetPriceWithCurrency();

  useEffect(() => {
    if (!concernedNft.data) return;
    if (!concernedNft.data.allowedActions) return;
    setFormFields(Object.keys(concernedNft.data.allowedActions));
  }, [concernedNft]);

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
        aside={<NftAside getPriceWithCurrency={getPriceWithCurrency} />}
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
                formFields.map((fieldName) => {
                  const label =
                    fieldName[0].toUpperCase() +
                    fieldName.replace('_', ' ').slice(1);
                  const type = concernedNft.data!.allowedActions[
                    fieldName
                  ] as FormFieldInputType;

                  const useBaseCurrencySymbol =
                    type === 'number' && label === 'Price';
                  return (
                    <Box key={fieldName}>
                      <InputSelector
                        attributesName={fieldName}
                        label={label}
                        type={type}
                        baseCurrencySymbol={
                          useBaseCurrencySymbol
                            ? getCurrencySymbolDataForCurrency(baseCurrency)
                                ?.symbol
                            : undefined
                        }
                      />
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </SimpleForm>
      </Edit>
    )
  );
};
