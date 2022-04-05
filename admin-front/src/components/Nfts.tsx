import { Box, Paper, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
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
  NumberInput,
  NumberField,
  useGetOne,
  BooleanInput,
  NullableBooleanInput,
  ReferenceArrayInput,
  SelectArrayInput,
  ChipField,
  number,
  minValue,
  useNotify,
  useRefresh,
  useRedirect,
  ReferenceField,
  DateTimeInput,
  FunctionField
} from 'react-admin';
// import { DateTimeInput } from 'react-admin-date-inputs';
import { CustomDeleteButton } from './Buttons/CustomDeleteButton';
import ToolbarActions from './ToolbarActions';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import axios from 'axios';

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

export const NftList = ({ ...props }) => {

  const renderState = (state: 'creation' | 'setup_nft' | 'proposed' | 'prototype' | 'finish') => {
    switch (state) {
      case 'creation':
        return 'Ready for creative';
      case 'setup_nft':
        return 'Ready for commercials';
      case 'proposed':
        return 'Settings completed';
      case 'prototype':
        return 'Ready to publish';
      case 'finish':
        return 'Published';
      default:
        return state;
    }
  }

  return (
    <>
      <Stack direction="row">
        {`States are: 'Ready for creative' ->  'Ready for commercials' -> 'Settings completed' -> 'Ready to publish' -> 'Published'`}
      </Stack>
      <List {...props}
        actions={<ToolbarActions />}
        bulkActionButtons={<CustomDeleteButton {...props} />}
        sort={{ field: "id", order: "DESC" }}
      >
        <Datagrid rowClick="edit">
          <TextField source="id" />
          <TextField source="attributes.name" label="Name" />
          <FunctionField label="Current state" render={(record: any) => renderState(record.state)} />
          <NumberField source="attributes.price" label='Price' />
          <NumberField source="attributes.editions_size" label='Token amount' />
          <FunctionField label="Creation time" render={(record: any) => `${format(
            record.createdAt * 1000 ? new Date(record.createdAt * 1000) : new Date(),
            'dd/MM/yyyy - HH : mm : ss',
          )}`} />
          <FunctionField label="Last updated" render={(record: any) => `${format(
            record.updatedAt * 1000 ? new Date(record.updatedAt * 1000) : new Date(),
            'dd/MM/yyyy - HH : mm : ss',
          )}`} />
          <ReferenceField label="Created by" source="createdBy" reference="user">
            <ChipField source="userName" />
          </ReferenceField>
        </Datagrid>
      </List>
    </>
  )
};

interface InbutSelectorProps {
  attributesName: string;
  label: string;
  type: "string" | "boolean" | "number" | "content_uri" | "number[]" | "votes" | "date" | "none";
  record?: any;
  numberValueArray?: string[];
}

const InputSelector: React.FC<InbutSelectorProps> = ({ ...props }) => {

  const validateNumber = [number(), minValue(0)];
  const validateDate = (value: any) => {
    if (value < new Date().getTime()) return 'Date must be in the future'
    return undefined
  };

  const classes = useStyle()

  if (props.type === 'string') return <TextInput source={`attributes.${props.attributesName}`} label={props.label} />;
  if (props.type === 'number') return <NumberInput source={`attributes.${props.attributesName}`} label={props.label} validate={validateNumber} />;
  if (props.type === 'boolean') return <BooleanInput source={`attributes.${props.attributesName}`} label={props.label} />;
  if (props.type === 'date') return <DateTimeInput source={`attributes.${props.attributesName}`} label={props.label} value={props.record * 1000} validate={validateDate} />;
  if (props.type === 'number[]') {
    return (
      <ReferenceArrayInput source="attributes.categories" label="categories" reference="categories/assignable">
        <SelectArrayInput optionText="name" className={classes.reference} />
      </ReferenceArrayInput>
    );
  }
  if (props.type === 'votes') return <NullableBooleanInput source={`attributes.${props.attributesName}`} label={props.label}
    format={(val: 'yes' | 'no') => val === 'yes' ? true : val === 'no' ? false : undefined}
    parse={(val: string) => val === 'true' ? 'yes' : 'no'}
  />;
  if (props.type === 'content_uri') {

    return (
      <ImageInput label={props.label} source={`files[${props.label}]`} accept="image/*">
        <ImageField src={`attributes.${props.label}`} source="src" title="title" />
      </ImageInput>
    );
  }
  else return null
}

const FieldSelector: React.FC<InbutSelectorProps> = ({ ...props }) => {

  const notify = useNotify()

  const [voters, setVoters] = React.useState<Record[]>([])
  const [votersCalled, setVotersCalled] = React.useState<boolean>(false)

  const getVoters = () => {
    const instantVoters: any[] = []
    props.record.proposal_vote?.yes?.concat(props.record.proposal_vote.no).map(async (id: number) => {
      const res = await axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + `/user/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
        }
      })
      if (res.data.error === 400) return notify(res.data.error?.message);
      instantVoters.push(res.data)
    })
    setVoters(instantVoters)
  }

  React.useEffect(() => {
    if (props.type !== 'votes') return;
    if (voters.length > 0 || votersCalled) return;
    setVotersCalled(true)
    getVoters()
  }, [])

  if (!props.record || !props.type) return null;

  if (props.type === 'string' || props.type === 'number') {
    return <Stack direction="column">
      <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
        {props.label}
      </Typography>
      <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
        {
          props.record[props.attributesName]}
      </Typography>
    </Stack>
  }
  if (props.type === 'date') {
    return <Stack direction="column">
      <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
        {props.label}
      </Typography>
      <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
        {format(new Date(props.record[props.attributesName]), 'PPP')}
      </Typography>
    </Stack>
  }
  if (props.type === 'number[]') {
    return (
      < Stack direction="row" >
        <Stack direction="column">
          <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
            {props.label}
          </Typography>
          <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
            {
              props.numberValueArray?.map((value: string) => value ? `${value}, ` : '')
            }
          </Typography>
        </Stack>
      </Stack >
    );
  }
  if (props.type === 'votes') {
    return <Stack direction="column">
      <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
        {props.label}
      </Typography>
      <Stack direction="row">
        <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
          <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold' }}>
            Accepted:
          </Typography>
          {
            props.record[props.attributesName] &&
            props.record[props.attributesName] !== null &&
            props.record[props.attributesName]['yes'].map(
              (id: number, index: number) =>
                voters.map(voter => {
                  if (voter.id === id) {
                    return index === props.record[props.attributesName]['yes'].length - 1 ? `${voter.userName}` : `${voter.userName}, `
                  }
                })
            )}
        </Typography>
      </Stack>
      <Stack direction="row">
        <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', marginLeft: '1em', marginBottom: '1em', marginTop: '0.5em' }}>
          <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold' }}>
            Rejected:
          </Typography>
          {
            props.record[props.attributesName] &&
            props.record[props.attributesName] !== null &&
            props.record[props.attributesName]['no'].map(
              (id: number, index: number) =>
                voters.map(voter => {
                  if (voter.id === id) {
                    return index === props.record[props.attributesName]['no'].length - 1 ? `${voter.userName}` : `${voter.userName}, `
                  }
                })
            )}
        </Typography>
      </Stack>
    </Stack>
  };

  if (props.type === 'content_uri' && props.attributesName !== 'image.png') {
    return <Stack direction="column">
      <Typography variant="subtitle2" style={{ fontFamily: 'Poppins SemiBold', color: '#c4C4C4' }}>
        {props.label}

      </Typography>
      <img src={props.record[props.attributesName]} style={{ maxWidth: '100px', maxHeight: '100px' }} />
    </Stack>
  }
  else return null
}

const NftAside = ({ ...props }) => {

  const [formKeys, setFormKeys] = React.useState<string[]>([])

  React.useEffect(() => {
    if (!props.record) return;
    if (!props.record.attributes) return;

    setFormKeys(Object.keys(props.record.attributes))
  }, [props.record])


  const [categories, setCategories] = React.useState<Record[]>([])
  const [categoriesCalled, setCategoriesCalled] = React.useState<boolean>(false)
  const [attributesTypes, setAttributesTypes] = React.useState()

  const getAttributesTypes = () => {
    axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + '/nft/attributes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      }
    })
      .then((response: any) => {
        setAttributesTypes(response.data)
      }).catch((error: any) => {
        console.log(error)
      })
  }

  const getAssignableCategories = () => {
    axios.get(process.env.REACT_APP_API_SERVER_BASE_URL + '/categories/assignable', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('KanvasAdmin - Bearer')}`
      }
    })
      .then((response: any) => {
        setCategories(response.data.data.map((cat: any) => props.record.attributes.categories.indexOf(cat.id) !== -1 ? cat : undefined))
      }).catch((error: any) => {
        console.log(error)
      })
  }

  React.useEffect(() => {
    if (!props.record) return;
    if (!props.record.attributes) return;

    if (categories.length > 0 || categoriesCalled) return;
    setCategoriesCalled(true)
    getAssignableCategories()
  }, [props.record])

  React.useEffect(() => {
    getAttributesTypes()
  }, [])

  return (
    <Paper style={{ width: 750, marginLeft: '1em' }}>
      <div style={{ margin: '1em' }}>
        <Typography variant="h6" style={{ fontFamily: 'Poppins SemiBold' }}>
          Preview your nft
        </Typography>
        <Typography variant="body2" style={{ fontFamily: 'Poppins Medium', color: "#c4c4c4" }}>
          Representation of the Nft
        </Typography>
        <Stack direction="row" sx={{ position: 'relative', alignItems: 'flex-end', margin: '2em', height: '100%', flexGrow: 1 }} spacing={3}>

          <Box sx={{ minHeight: '100px', display: 'flex', flexDirection: "column", flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <img src={props.record?.attributes["image.png"]} style={{ margin: 'auto', maxWidth: '80%', maxHeight: '80%' }} />
          </Box>

          <Stack direction="column" sx={{ flexStart: 'end', width: '60%' }}>
            {
              formKeys.length > 0 && attributesTypes &&
              formKeys.map(key => {
                return <FieldSelector
                  attributesName={key}
                  label={key[0].toUpperCase() + key.replace('_', ' ').slice(1)}
                  type={attributesTypes[key] as 'string' | 'boolean' | 'number' | 'content_uri' | 'number[]' | 'votes' | 'date'}
                  record={props.record.attributes}
                  numberValueArray={key === 'categories' ? categories.map((category: Record) => category?.name) : []}
                />
              }
              )
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
                    type={concernedNft.data!.allowedActions[key] as 'string' | 'boolean' | 'number' | 'content_uri' | 'number[]' | 'votes' | 'date'}
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
