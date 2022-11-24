import { Datagrid, FunctionField, List, TextField } from 'react-admin';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { headerStyles } from '../../shared/styles/headerStyles';
import { isUS } from '../../utils/utils';
dayjs.extend(utc);

export const UsersActivityList = ({ ...props }) => {
  const classes = headerStyles();
  const dateFormat = isUS() ? 'MM/DD' : 'DD/MM';
  return (
    <List
      {...props}
      sort={{ field: 'id', order: 'DESC' }}
      bulkActionButtons={false}
    >
      <Datagrid>
        <TextField source="id" headerClassName={classes.header} label="Id" />
        <TextField
          source="address"
          headerClassName={classes.header}
          label="Address"
        />
        <FunctionField
          label="Creation time"
          render={(record: any) =>
            `${
              record.createdAt * 1000
                ? dayjs(new Date(record.createdAt * 1000)).format(
                    dateFormat + '/YYYY - hh : mm : ss A',
                  )
                : dayjs().format(dateFormat + '/YYYY - hh : mm : ss A')
            }`
          }
        />
        <TextField
          source="email"
          label="Email"
          headerClassName={classes.header}
        />
        <TextField
          source="marketing_consent"
          label="Marketing consent"
          headerClassName={classes.header}
        />
      </Datagrid>
    </List>
  );
};
