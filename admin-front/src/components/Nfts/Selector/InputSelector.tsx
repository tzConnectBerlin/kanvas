import { FC, useEffect, useState } from 'react';
import {
  BooleanInput,
  DateTimeInput,
  FileField,
  FileInput,
  minValue,
  number,
  ReferenceArrayInput,
  RadioButtonGroupInput,
  SelectArrayInput,
  TextInput,
  useNotify,
} from 'react-admin';
import { useStyle } from '../useStyle';
import { InputSelectorProps } from './types';
import {
  getBaseCurrencyFromAPI,
  getCurrencySymbolDataForCurrency,
} from 'shared/hooks/useGetPriceWithCurrency';
import { CurrencySymbolData } from 'shared/types/currency';

export const InputSelector: FC<InputSelectorProps> = ({ ...props }) => {
  const notify = useNotify();
  const [currencySymbol, setCurrencySymbol] =
    useState<CurrencySymbolData['symbol']>();

  useEffect(() => {
    getBaseCurrencyFromAPI({ notify }).then((baseCurrency) => {
      const currSymbol = getCurrencySymbolDataForCurrency(baseCurrency);
      setCurrencySymbol(currSymbol?.symbol);
    });
  }, [notify]);

  const validateNumber = [number('expecting a number'), minValue(0)];
  const validateDate = (value: any) => {
    if (value < new Date().getTime()) return 'Date must be in the future';
    return undefined;
  };

  const classes = useStyle();

  const showCurrency = props.type === 'number' && props.label === 'Price';

  const { type } = props;

  if (type === 'string')
    return (
      <TextInput
        source={`attributes.${props.attributesName}`}
        label={props.label}
      />
    );
  if (type === 'text')
    return (
      <TextInput
        source={`attributes.${props.attributesName}`}
        label={props.label}
        fullWidth
        multiline
      />
    );
  if (type === 'number')
    return (
      <TextInput
        source={`attributes.${props.attributesName}`}
        label={
          showCurrency && currencySymbol
            ? props.label + ` in ${currencySymbol}`
            : props.label
        }
        validate={validateNumber}
      />
    );
  if (type === 'boolean')
    return (
      <BooleanInput
        source={`attributes.${props.attributesName}`}
        label={props.label}
      />
    );
  if (type === 'date')
    return (
      <DateTimeInput
        source={`attributes.${props.attributesName}`}
        label={props.label}
        value={props.record * 1000}
        validate={validateDate}
      />
    );
  if (type === 'number[]') {
    return (
      <ReferenceArrayInput
        source="attributes.categories"
        label="categories"
        reference="categories/assignable"
      >
        <SelectArrayInput optionText="name" className={classes.reference} />
      </ReferenceArrayInput>
    );
  }
  if (type === 'votes') {
    return (
      <RadioButtonGroupInput
        source={`attributes.${props.attributesName}`}
        label={props.label}
        choices={[
          {
            id: 'yes',
            name: 'Yes',
          },
          {
            id: 'no',
            name: 'No',
          },
        ]}
        format={(val: 'yes' | 'no') => {
          return val === 'yes' ? true : val === 'no' ? false : undefined;
        }}
      />
    );
  }
  if (props.type === 'content_uri') {
    return (
      <FileInput label={props.label} source={`files[${props.label}]`}>
        <FileField
          src={`attributes.${props.label}`}
          source="src"
          title="title"
        />
      </FileInput>
    );
  } else return null;
};
