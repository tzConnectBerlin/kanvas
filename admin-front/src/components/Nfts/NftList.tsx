import { Breadcrumbs, Stack, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import {
  ChipField,
  Datagrid,
  FunctionField,
  List,
  NumberField,
  ReferenceField,
  Responsive,
  SimpleList,
  TextField,
} from 'react-admin';
import styled from '@emotion/styled';
import { format } from 'date-fns';
import useGetPriceWithCurrency from '../../shared/hooks/useGetPriceWithCurrency';
import ToolbarActions from '../ToolbarActions';
import { CustomDeleteButton } from '../Buttons/CustomDeleteButton';

const StyledTypography = styled(Typography)({
  fontSize: '0.8rem',
});

export const NftList = ({ ...props }) => {
  const { getPriceWithCurrency } = useGetPriceWithCurrency();

  const renderState = (
    state: 'creation' | 'setup_nft' | 'proposed' | 'prototype' | 'finish',
  ) => {
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
  };

  return (
    <>
      <Stack direction="row" alignItems="baseline">
        <Typography style={{ fontSize: '0.8rem', marginRight: '0.4rem' }}>
          States are:
        </Typography>
        <Breadcrumbs separator={<NavigateNext color="secondary" />}>
          <StyledTypography variant="body1" color="text.secondary">
            Ready for creative
          </StyledTypography>
          <StyledTypography variant="body1" color="text.secondary">
            Ready for commercials
          </StyledTypography>
          <StyledTypography variant="body1" color="text.secondary">
            Settings completed
          </StyledTypography>
          <StyledTypography variant="body1" color="text.secondary">
            Ready to publish
          </StyledTypography>
          <StyledTypography variant="body1" color="text.secondary">
            Published
          </StyledTypography>
        </Breadcrumbs>
      </Stack>
      <List
        {...props}
        actions={<ToolbarActions />}
        bulkActionButtons={<CustomDeleteButton {...props} />}
        sort={{ field: 'id', order: 'DESC' }}
      >
        <Responsive
          medium={
            <Datagrid rowClick="edit">
              <TextField source="id" />
              <TextField source="attributes.name" label="Name" />
              <FunctionField
                label="Current state"
                render={(record: any) => renderState(record.state)}
              />
              <FunctionField
                label="Price"
                render={(record: any) => {
                  return record.attributes.price
                    ? getPriceWithCurrency(record.attributes.price)
                    : '-';
                }}
              />
              <NumberField
                source="attributes.edition_size"
                label="Token amount"
              />
              <FunctionField
                label="Creation time"
                render={(record: any) =>
                  `${format(
                    record.createdAt * 1000
                      ? new Date(record.createdAt * 1000)
                      : new Date(),
                    'dd/MM/yyyy - HH : mm : ss',
                  )}`
                }
              />
              <FunctionField
                label="Last updated"
                render={(record: any) =>
                  `${format(
                    record.updatedAt * 1000
                      ? new Date(record.updatedAt * 1000)
                      : new Date(),
                    'dd/MM/yyyy - HH : mm : ss',
                  )}`
                }
              />
              <ReferenceField
                label="Created by"
                source="createdBy"
                reference="user"
              >
                <ChipField source="userName" />
              </ReferenceField>
            </Datagrid>
          }
          small={
            <SimpleList
              primaryText={(record: any) => record.attributes.name}
              secondaryText={(record: any) => renderState(record.state)}
              tertiaryText={(record: any) =>
                `${format(
                  record.createdAt * 1000
                    ? new Date(record.createdAt * 1000)
                    : new Date(),
                  'dd/MM/yyyy - HH : mm : ss',
                )}`
              }
            />
          }
        />
      </List>
    </>
  );
};
