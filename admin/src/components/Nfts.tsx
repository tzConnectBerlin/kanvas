import { Box, Card, Paper, Stack, Typography, unstable_useEnhancedEffect } from '@mui/material';
import {
  Record,
  List,
  Datagrid,
  TextField,
  Edit,
  SimpleForm,
  TextInput,
  Create,
  ImageInput,
  ImageField,
  DateField,
  NumberInput,
  NumberField,
  useGetOne,
  BooleanInput,
  NullableBooleanInput,
  ReferenceArrayInput,
  SelectArrayInput,
  ReferenceManyField,
  SingleFieldList,
  ChipField,
  number,
  minValue,
  useGetMany,
  useDataProvider,
  useNotify,
  useRefresh,
  useRedirect
} from 'react-admin';
import { JsonField } from 'react-admin-json-view';
import { CustomDeleteButton } from './Buttons/CustomDeleteButton';
import ToolbarActions from './ToolbarActions';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';

const useStyle = makeStyles({
  boxWrapper: {
    paddingLeft: '1em'
  },
  title: {
    paddingBottom: '1rem',
    fontFamilly: 'Poppins SemiBold !important',
  },
  subtitle: {
    lineHeight: '1.2em !important',
    color: "#c4c4c4 !important",
    marginTop: '0.5rem !important',
    paddingLeft: '1rem'
  },
  form: {
    marginTop: '1rem'
  },
  reference: {
    minWidth: "16em !important"
  }
})

export const NftList = ({ ...props }) => (
  <List {...props}
    actions={<ToolbarActions />}
    bulkActionButtons={<CustomDeleteButton {...props} />}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="attributes.name" label="Name" />
      <TextField source="state" label="Current State" />
      <NumberField source="attributes.price" label='Price' />
      <NumberField source="attributes.editions_size" label='Token amount' />
      <DateField source="createdAt" label="Created at" showTime />
      <DateField source="updatedAt" label="Last updated at" showTime />
      <ReferenceManyField label="Created by" source="createdBy" reference="user" target="id">
        <SingleFieldList>
          <ChipField source="userName" />
        </SingleFieldList>
      </ReferenceManyField>
    </Datagrid>
  </List>
);

interface InbutSelectorProps {
  attributesName: string;
  label: string;
  type: "string" | "boolean" | "number" | "content_uri" | "number[]" | "votes";
  record?: any;
}

const InputSelector: React.FC<InbutSelectorProps> = ({ ...props }) => {

  const validateNumber = [number(), minValue(0)]
  const classes = useStyle()

  if (props.type === 'string') return <TextInput source={`attributes.${props.attributesName}`} label={props.label} />;
  if (props.type === 'number') return <NumberInput source={`attributes.${props.attributesName}`} label={props.label} validate={validateNumber} />;
  if (props.type === 'boolean') return <BooleanInput source={`attributes.${props.attributesName}`} label={props.label} />;
  if (props.type === 'number[]') {
    return (
      <ReferenceArrayInput source="attributes.categories" label="categories" reference="categories/assignable">
        <SelectArrayInput optionText="name" className={classes.reference} />
      </ReferenceArrayInput>
    );
  }
  if (props.type === 'votes') return <NullableBooleanInput source={`attributes.${props.attributesName}`} label={props.label} />;
  if (props.type === 'content_uri') {

    return (
      <ImageInput source="files" accept="image/*">
        <ImageField src="attributes.image.png" source="src" title="title" />
      </ImageInput>
    );
  }
  else return null
}

const NftAside = ({ ...props }) => {

  const dataProvider = useDataProvider()
  const [categories, setCategories] = React.useState<Record[]>([])

  React.useEffect(() => {
    if (!props.record) return;
    if (!props.record.attributes) return;
    if (categories) return;
    dataProvider.getMany('categories', {ids: props.record.attributes.categories})
      .then(response => {
        setCategories(response.data)
      })
  }, [props])

  return (
    <Paper style={{ width: 750, marginLeft: '1em' }}>
      <div style={{ margin: '1em' }}>
        <Typography variant="h6" style={{ fontFamily: 'Poppins SemiBold' }}>
          Preview your nft
        </Typography>
        <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', color: "#c4c4c4" }}>
          Representation of the Nft
        </Typography>
        <Stack direction="row" sx={{position: 'relative', alignItems: 'flex-end', margin: '2em', height: '100%', flexGrow: 1 }} spacing={3}>

          <Box sx={{minHeight: '100px', display: 'flex', flexDirection: "column", flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <img src={props.record?.attributes["image.png"]} style={{ margin: 'auto', maxWidth: '80%', maxHeight: '80%' }} />
          </Box>

          <Stack direction="column" sx={{ flexStart: 'end', width: '60%' }}>
            {
              props.record &&
              Object.keys(props.record?.attributes)?.map(attrKey => {

                if (attrKey === "proposal_reject_0") return;
                if (attrKey === "image.png") return;
                if (categories.length > 0 && attrKey === "categories") return (
                  <Stack direction="row">
                    <Stack direction="column">
                      <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
                        {attrKey[0].toUpperCase() + attrKey.replace('_', ' ').slice(1)}
                      </Typography>
                      <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
                        {categories.map(category => {
                          if (!category) return;
                          return category.name + (categories.indexOf(category) === categories.length - 1 ? '' : ', ')
                        }
                        )
                        }
                      </Typography>
                    </Stack>
                  </Stack>
                )
                return (
                  <Stack direction="row">
                    <Stack direction="column">
                      <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
                        {attrKey[0].toUpperCase() + attrKey.replace('_', ' ').slice(1)}
                      </Typography>
                      <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
                        {props.record.attributes[attrKey]}
                      </Typography>
                    </Stack>
                  </Stack>)
              })
            }
          </Stack>
        </Stack>
      </div>
    </Paper>
  )
};

// Add authorization for allowedActions
export const NftEdit = (props: any) => {

  const classes = useStyle()
  const concernedNft = useGetOne('nft', props.id);

  const [formKeys, setFormKeys] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!concernedNft.data) return;
    if (!concernedNft.data.allowedActions) return;
    setFormKeys(Object.keys(concernedNft.data!.allowedActions))
  }, [concernedNft])

  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`Nft updated successfully`);
    redirect('/nft');
    refresh();
  };

  return (
    concernedNft &&
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
            <Typography variant="h4" component="h2" className={classes.title} style={{ fontFamily: 'Poppins SemiBold' }}>
              Update an NFT
            </Typography>
            {
              formKeys.length > 0 &&
              formKeys.map(key =>
                <Box>
                  <InputSelector
                    attributesName={key}
                    label={key[0].toUpperCase() + key.replace('_', ' ').slice(1)}
                    type={concernedNft.data!.allowedActions[key] as 'string' | 'boolean' | 'number' | 'content_uri' | 'number[]' | 'votes'}
                  />
                </Box>
              )
            }
          </Box>
        </Box>
      </SimpleForm>
    </Edit>
  );
};

// Add authorization for allowedActions
export const NftCreate = ({ ...props }) => {

  const classes = useStyle()


  const notify = useNotify();
  const refresh = useRefresh();
  const redirect = useRedirect();

  const onSuccess = () => {
    notify(`Nft created successfully`);
    redirect('/nft');
    refresh();
  };

  return (
    <Create onSuccess={onSuccess} {...props}>
      <SimpleForm className={classes.form}>
        <Box className={classes.boxWrapper}>
          <Typography variant="h4" component="h1" className={classes.title} style={{ fontFamily: 'Poppins SemiBold' }}>
            Create an NFT
          </Typography>
          <TextInput source="attributes.name" label="Name" />
        </Box>
      </SimpleForm>
    </Create>
  );
};
