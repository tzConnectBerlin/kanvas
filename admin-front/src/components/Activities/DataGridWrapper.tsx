import {
  Datagrid,
  FunctionField,
  TextField,
  useListContext,
} from 'react-admin';
import { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import useGetPriceWithCurrency from 'shared/hooks/useGetPriceWithCurrency';
import { isUS } from 'utils/utils';
import { headerStyles } from 'shared/styles/headerStyles';

interface WrapperProps {
  fromValue: Dayjs;
  toValue: Dayjs;
}

const DataGridWrapper = ({ fromValue, toValue }: WrapperProps) => {
  const { getPriceWithCurrency } = useGetPriceWithCurrency();
  const { setFilters } = useListContext();

  const classes = headerStyles();

  useEffect(() => {
    setFilters(
      {
        from: dayjs(fromValue).utc().toISOString(),
        to: dayjs(toValue).utc().toISOString(),
      },
      {},
    );
  }, [fromValue, toValue]);

  const dateFormat = isUS() ? 'MM/DD' : 'DD/MM';

  return (
    <>
      <Datagrid>
        <TextField source="id" headerClassName={classes.header} label="Id" />
        <TextField
          source="tokenId"
          headerClassName={classes.header}
          label="Token"
        />
        <FunctionField
          label="Timestamp"
          render={(record: any) =>
            `${
              record.timestamp * 1000
                ? dayjs(new Date(record.timestamp * 1000)).format(
                    dateFormat + '/YYYY - hh : mm : ss A',
                  )
                : dayjs().format(dateFormat + '/YYYY - hh : mm : ss A')
            }`
          }
        />
        <TextField
          source="kind"
          headerClassName={classes.header}
          label="Kind"
        />
        <FunctionField
          label="Price"
          render={(record: any) => {
            return record.price ? getPriceWithCurrency(record.price) : '-';
          }}
        />
        <TextField
          source="amount"
          label="Edition size"
          headerClassName={classes.header}
        />
        <TextField source="to" headerClassName={classes.header} label="To" />
      </Datagrid>
    </>
  );
};

export default DataGridWrapper;
