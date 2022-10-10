export type FormFieldInputType =
  | 'string'
  | 'boolean'
  | 'number'
  | 'content_uri'
  | 'number[]'
  | 'votes'
  | 'date'
  | 'none'
  | 'text';

export interface InputSelectorProps {
  attributesName: string;
  label: string;
  type: FormFieldInputType;
  record?: any;
  numberValueArray?: string[];
}
