import Chip from '@material-ui/core/Chip';
import { ArrayFieldProps } from 'ra-ui-materialui';
import * as React from 'react';
import { useRecordContext } from 'react-admin';

interface TextArrayFieldProps extends ArrayFieldProps {
  value: string[];
}

export const TextArrayField: React.FC<TextArrayFieldProps> = ({
  source,
  value,
}) => {
  const record = useRecordContext();
  const array = source ? record?.[source] : [];

  if (typeof array === 'undefined' || array === null || array.length === 0) {
    return <div />;
  } else {
    return (
      <>
        {array.map((item: string | number) => (
          <Chip label={value[+item - 1]} key={item} />
        ))}
      </>
    );
  }
};

TextArrayField.defaultProps = { addLabel: true };
