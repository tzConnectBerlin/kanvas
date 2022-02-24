import { TopToolbar } from "react-admin";
import { CustomCreateButton } from "../Buttons/CustomCreateButton";
import { CustomExportButton } from "../Buttons/CustomExportButton";
import { makeStyles } from '@material-ui/core/styles';

const useStyle = makeStyles({
    toolbar: {
        display: 'flex',
        columnGap: '20px',
        justifyContent: 'space-between'
    }
})

export const ToolbarActions = (...props: any) => {
    const classes = useStyle();

    return (
        <TopToolbar className={classes.toolbar}>
            <CustomCreateButton />
            <CustomExportButton />
        </TopToolbar>
    )
};
