import { format } from "date-fns";
import { List, Datagrid, TextField, FunctionField } from "react-admin";

export const ActivityList = ({ ...props }) => {
    return (
        <List {...props} sort={{ field: 'timestamp', order: 'DESC' }}>
            <Datagrid rowClick="edit">
                <TextField source="id" />
                <TextField source="tokenId" />
                <FunctionField label="Timestamp" render={(record: any) => `${format(
                    record.timestamp * 1000 ? new Date(record.timestamp * 1000) : new Date(),
                    'dd/MM/yyyy - HH : mm : ss',
                )}`} />
                <TextField source="kind" />
                <FunctionField label="Price" render={(record: any) => record.price ? `${record.price} tez` : '-'} />
                <TextField source="amount" label="Edition size"/>
                <TextField source="from" />
                <TextField source="to" />
            </Datagrid>
        </List>
    );
};