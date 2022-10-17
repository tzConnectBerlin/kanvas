import { BooleanInput, FileField, FileInput } from 'react-admin';
import { FC, useState } from 'react';
import { SelectorProps } from './types';

const DisplaySelector: FC<SelectorProps> = (props) => {
  const [showDisplay, setShowDisplay] = useState(false);
  const [showSwitch, setShowSwitch] = useState(true);
  const { label } = props;

  const toggleShowDisplay = () => {
    setShowDisplay(!showDisplay);
  };

  const handleOnRemove = () => {
    setShowSwitch(true);
    setShowDisplay(false);
  };

  const handleOnDrop = () => {
    setShowSwitch(false);
  };

  return (
    <>
      {showSwitch && (
        <BooleanInput
          source={`addDisplayBooleanInput`}
          label={'add display'}
          options={{ checked: showDisplay }}
          onChange={() => toggleShowDisplay()}
        />
      )}
      {showDisplay && (
        <FileInput
          label={label}
          source={`files[${label}]`}
          options={{
            onDrop: handleOnDrop,
            onRemove: handleOnRemove,
          }}
        >
          <FileField src={`attributes.${label}`} source="src" title="title" />
        </FileInput>
      )}
    </>
  );
};

export default DisplaySelector;
