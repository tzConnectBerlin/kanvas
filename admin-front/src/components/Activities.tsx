import { List, Datagrid, TextField, EmailField, SingleFieldList, ChipField } from "react-admin";
import { CustomDeleteButton } from "./Buttons/CustomDeleteButton";
import { TextArrayField } from "./TextArrayField";
import ToolbarActions from "./ToolbarActions";


export const ActivityList = ({ ...props }) => {
    return (
        <List {...props}>
            <Datagrid rowClick="edit">
                <TextField source="id" />
                <TextField source="disabled" />
                <TextField source="userName" />
                <TextField source="address" />
                <EmailField source="email" />
            </Datagrid>
        </List>
    );
};