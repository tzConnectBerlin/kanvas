import { List, Datagrid, TextField, NumberField } from "react-admin";

export const ActivityList = ({ ...props }) => {
    return (
        <List sort={{ field: 'at', order: 'DESC' }} {...props}>
            <Datagrid>
                <TextField source="kind" />
                <TextField source="tokenId" />
                <NumberField source="price" />
                <NumberField source="amount" />
                <TextField source="from" />
                <TextField source="to" />
                <TextField source="at" />
            </Datagrid>
        </List>
    );
};