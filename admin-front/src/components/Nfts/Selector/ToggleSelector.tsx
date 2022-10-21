import { FC, useState } from 'react';
import { BooleanInput, FileField, FileInput } from 'react-admin';
import { SelectorProps } from './types';

interface ToggleSelectorProps extends SelectorProps {
  toggleSource: string;
  toggleLabel: string;
}

const ToggleSelector: FC<ToggleSelectorProps> = (props) => {
  const [showFileInput, setFileInput] = useState(false);
  const [showSwitch, setShowSwitch] = useState(true);
  const { label, toggleSource, toggleLabel } = props;

  const toggleShowFileInput = () => {
    setFileInput(!showFileInput);
  };

  const handleOnRemove = () => {
    setShowSwitch(true);
    setFileInput(false);
  };

  const handleOnDrop = () => {
    setShowSwitch(false);
  };

  return (
    <>
      {showSwitch && (
        <BooleanInput
          source={toggleSource}
          label={toggleLabel}
          options={{ checked: showFileInput }}
          onChange={() => toggleShowFileInput()}
        />
      )}
      {showFileInput && (
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

export default ToggleSelector;
