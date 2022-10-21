import { FC } from 'react';
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
} from 'react-admin';
import { useStyle } from '../useStyle';
import { SelectorProps } from './types';
import { CurrencySymbolData } from 'shared/types/currency';
import ToggleSelector from './ToggleSelector';

interface InputSelectorProps extends SelectorProps {
  baseCurrencySymbol?: CurrencySymbolData['symbol'];
}

export const InputSelector: FC<InputSelectorProps> = ({ ...props }) => {
  const validateNumber = [number('expecting a number'), minValue(0)];
  const validateDate = (value: any) => {
    if (value < new Date().getTime()) return 'Date must be in the future';
    return undefined;
  };

  const classes = useStyle();

  const { type, label } = props;

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
        label={label}
        fullWidth
        multiline
      />
    );
  if (type === 'number') {
    const isPriceLabel = label === 'Price' && !!props.baseCurrencySymbol;

    const textInputLabel = isPriceLabel
      ? label + ` in ${props.baseCurrencySymbol}`
      : label;
    return (
      <TextInput
        source={`attributes.${props.attributesName}`}
        label={textInputLabel}
        validate={validateNumber}
      />
    );
  }

  if (type === 'boolean')
    return (
      <BooleanInput
        source={`attributes.${props.attributesName}`}
        label={label}
      />
    );
  if (type === 'date')
    return (
      <DateTimeInput
        source={`attributes.${props.attributesName}`}
        label={label}
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
        label={label}
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
    switch (label) {
      case 'Display':
        return (
          <ToggleSelector
            toggleSource={'addDisplayBooleanInput'}
            toggleLabel={'add display'}
            {...props}
          />
        );
      case 'Thumbnail':
        return (
          <ToggleSelector
            toggleSource={'addThumbnailBooleanInput'}
            toggleLabel={'add thumbnail'}
            {...props}
          />
        );
      default:
        return (
          <FileInput label={label} source={`files[${label}]`}>
            <FileField src={`attributes.${label}`} source="src" title="title" />
          </FileInput>
        );
    }
  } else return null;
};
