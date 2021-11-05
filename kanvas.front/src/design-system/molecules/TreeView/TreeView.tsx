import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import Typography from '../../atoms/Typography';
import styled from  "@emotion/styled";
import { Checkbox, Stack, Theme } from '@mui/material';
import { FC, useState } from 'react';

interface StyledTreeViewProps {
    open?: boolean;
    theme?: Theme;
    asChildren?: boolean;
}

interface TreeViewProps extends StyledTreeViewProps {
    nodes?: any;
    selectedFilters: any[];
    setSelectedFilters: Function;
    filterFunction: Function;
}


const StyledTreeItem = styled(TreeItem)<StyledTreeViewProps>`
    font-size: 2rem !important;

    .MuiTreeItem-iconContainer {
        width: ${props => props.asChildren ? 'auto' : 0};
    }

    .MuiTreeItem-content {
        :hover {
            background-color: ${props => props.theme.palette.background.default} !important;
        }
    }

    path {
        color: ${props => props.theme.palette.text.primary};
    }

    color: ${props => props.color? props.color : props.theme.palette.text.primary ?? 'black'} !important;

    display: ${props => props.open ? '' : 'none'} !important;

    background-color: ${props => props.theme.palette.background.default} !important;

    .Mui-selected {
        background-color: ${props => props.theme.palette.background.default} !important;
    }
`

const StyledStack = styled(Stack)`
    height: 2rem;
    cursor: pointer;
`

const StyledDiv = styled.div<StyledTreeViewProps>`
    align-items: center;
    padding-top: 1rem;
    min-height: 2rem;
    cursor: pointer;
    width: ${props => props.open ? '' : 0} ;

`

const StyledTreeView = styled(TreeView)<StyledTreeViewProps>`
    width: ${props => props.open ? '15rem' : 0} ;
    transition: width 0.2s;
    flex-grow: 0;

    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
`

const data = {
    id: 'root',
    name: 'Categories',
    children: [
      {
        id: '1',
        name: 'Footballers',
      },
      {
        id: '2',
        name: 'Goals',
      },
      {
        id: '3',
        name: 'Child - 3',
        children: [
          {
            id: '4',
            name: 'Child - 4',
          },
        ],
      },
    ],
  };

const IconExpansionTreeView : FC<TreeViewProps> = ({selectedFilters, setSelectedFilters, ...props}) => {

    const handleMultiSelect = (nodesName: string) => {
        if (selectedFilters.indexOf(nodesName) !== -1) {
            setSelectedFilters(selectedFilters.filter(filterName => filterName !== nodesName))
        } else {
            setSelectedFilters([...selectedFilters, nodesName])
        }
        props.filterFunction(nodesName)
    }

    const renderTree = (nodes: any) => (
        !nodes.children ?
            <StyledStack key={nodes.id} onClick={() => handleMultiSelect(nodes.name)} direction="row" sx={{paddingTop: '1rem', alignItems: 'center' }}>
                <Checkbox
                    checked={selectedFilters.indexOf(nodes.name) !== -1}
                    onChange={() => {}}
                    inputProps={{ 'aria-label': 'controlled' }}
                    disableRipple
                />
                <StyledTreeItem asChildren={nodes.children} open={props.open} key={nodes.id} nodeId={nodes.id} label={nodes.name}>

                    {Array.isArray(nodes.children)
                        ? nodes.children.map((node: any) => renderTree(node))
                        : null}
                </StyledTreeItem>
            </StyledStack>
        :
            <StyledDiv key={nodes.id} open={props.open}>
                <StyledTreeItem asChildren={nodes.children} open={props.open} key={nodes.id} nodeId={nodes.id} label={nodes.name}>
                    {Array.isArray(nodes.children)
                        ? nodes.children.map((node: any) => renderTree(node))
                        : null}
                </StyledTreeItem>
            </StyledDiv>
      );

    return (
        <StyledTreeView
            aria-label="multi-select"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            multiSelect
            open={props.open}
            sx={{
                paddingTop: '1rem',
                flexGrow: 1,
                maxWidth: 400
            }}
        >
            {renderTree(data)}
        </StyledTreeView>
    );
}

export default IconExpansionTreeView;