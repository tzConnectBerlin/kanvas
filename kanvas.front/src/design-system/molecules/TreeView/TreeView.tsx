import styled from  "@emotion/styled";
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';

import { Checkbox, Stack, Theme } from '@mui/material';
import { FC, useState } from 'react';

interface StyledTreeViewProps {
    open?: boolean;
    theme?: Theme;
}

interface TreeViewProps extends StyledTreeViewProps {
    nodes?: any[];
    loading: boolean;
    selectedFilters: number[];
    setSelectedFilters: Function;
    filterFunction: Function;
    collapsed: boolean;
}


const StyledDiv = styled.div<StyledTreeViewProps>`
    padding-left: 0.5rem;
    width : ${props => props.open ? 'auto' : '0'};
    height: 100%;
    transition: width 0.2s;
`

const StyledLi = styled.li<StyledTreeViewProps>`
    cursor: pointer;
    display : ${props => props.open ? 'flex' : 'none'};
    transition: width 0.2s;
    align-items: center;

    height: 3rem;
    transition: width 0.2s, height 0.2s;
`

const StyledCheckBox = styled(Checkbox)<{theme?: Theme}>`
    &.Mui-checked {
        color: ${props => props.theme.palette.text.primary} !important;
    }
`

const TreeView : FC<TreeViewProps> = ({selectedFilters, setSelectedFilters, ...props}) => {

    const selectChildren = (node: any, newSelectedFilters : any[] = []) => {
        if (node.children?.length > 0) {
            for (let child of node.children) {
                if (selectedFilters.indexOf(child.id) === -1) {
                    newSelectedFilters.push(child.id)
                }
                selectChildren(child, newSelectedFilters)
            }
        }
        return newSelectedFilters
    }

    const unSelectParent = (node: any, unSelectedParents : any[] = []) => {
        if (node.parent) {
            unSelectedParents.push(node.parent.id)
            unSelectParent(node.parent, unSelectedParents)
        }
        return unSelectedParents
    }

    const handleMultiSelect = (node: any) => {
        if (selectedFilters.indexOf(node.id) !== -1) {
            // Getting the parents of the nodes to unselect them
            const unSelectedParents = unSelectParent(node)
            // Adding the current node to the unselection
            unSelectedParents.push(node.id)
            setSelectedFilters(selectedFilters.filter(filterId => unSelectedParents.indexOf(filterId) === -1 ))
        } else {
            // Getting the children of the parent to select them
            const newSelectedChildren = selectChildren(node)
            setSelectedFilters([...selectedFilters, ...newSelectedChildren, node.id])
        }
    }

    const handleListItemClick = (concernedRef: any) => {
        if (activeRef.indexOf(concernedRef) !== -1) {
            setActiveRef(activeRef.filter(ref => ref !== concernedRef))
        } else {
            setActiveRef([...activeRef, concernedRef])
        }
    };

    const [activeRef, setActiveRef] = useState<any[]>([])

    const renderTree : any = (parentNode: any, children: any, checked: boolean) => {

        return children?.map((node: any) => {
            node.parent = parentNode

            return (
                <StyledDiv open={props.open} >
                    <StyledLi open={props.open} key={`${node.name}-${node.id}`} >
                        <Stack direction="row" sx={{alignItems: 'center', width: '100%'}}>
                            <StyledCheckBox
                                checked={selectedFilters.indexOf(node.id) !== -1}
                                onClick={() => handleMultiSelect(node)}
                                inputProps={{ 'aria-label': 'controlled' }}
                                disableRipple
                            />
                            <Stack direction="row" onClick={() => handleListItemClick(`${node.name}-${node.id}`)} sx={{width: '100%'}}>
                                <Typography size="h5" weight='Light' >{node.name}</Typography>

                                <FlexSpacer />

                                { node.children?.length && node.children?.length > 0 ?
                                    activeRef.indexOf(`${node.name}-${node.id}`) !== -1 ?
                                        <Typography size="h5" weight='Light'>-</Typography>
                                    :
                                        <Typography size="h5" weight='Light'>+</Typography>
                                :
                                    undefined
                                }
                            </Stack>
                        </Stack>
                    </StyledLi>
                    {activeRef.indexOf(`${node.name}-${node.id}`) !== -1 ?
                        renderTree(node, node.children, selectedFilters.indexOf(node.id) !== -1 || checked)
                    :
                        undefined}
                </StyledDiv>
            )}
        )
    }

    return ( props.nodes && !props.collapsed ? renderTree(props.nodes[0], props.nodes[0].children) : <></> )
}

export default TreeView;