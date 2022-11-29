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
        startDate: dayjs(fromValue).utc().toISOString(),
        endDate: dayjs(toValue).utc().toISOString(),
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
          source="edition_size"
          label="Edition size"
          headerClassName={classes.header}
        />
        <TextField
            source="transaction_value"
            label="Transaction value"
            sortable={false}
        />
        <TextField
            source="currency"
            label="Transaction currency"
            headerClassName={classes.header}
        />
        <TextField
            source="conversion_rate"
            label="Transaction conversion rate"
            sortable={false}
        />
        <FunctionField
            label="Gas fee"
            render={(record: any) => {
              return record.fee_in_base_currency && getPriceWithCurrency(record.fee_in_base_currency);
            }}
        />
        <TextField source="to" headerClassName={classes.header} label="To" />
        <TextField
            source="purchaser_country"
            label="Country of purchase"
            headerClassName={classes.header}
        />
      </Datagrid>
    </>
  );
};

export default DataGridWrapper;
