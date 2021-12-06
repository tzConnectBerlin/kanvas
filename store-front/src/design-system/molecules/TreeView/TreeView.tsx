import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';

import { Checkbox, Stack, Theme } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { IParamsNFTs } from '../../../pages/StorePage';
import { EscalatorWarningTwoTone } from '@mui/icons-material';

interface StyledTreeViewProps {
    open?: boolean;
    theme?: Theme;
}

interface TreeViewProps extends StyledTreeViewProps {
    nodes?: any[];
    loading: boolean;
    selectedFilters: number[];
    preSelectedFilters: number[];
    setSelectedFilters: Function;
    collapsed: boolean;
    callNFTsEndpoint: (input: IParamsNFTs) => void;
}

const StyledDiv = styled.div<StyledTreeViewProps>`
    padding-left: 1.5rem;
    width: ${(props) => (props.open ? 'auto' : '0')};
    transition: width 0.2s;
    min-height: 1.5rem;

    @media (min-width: 900px) {
        min-height: 3rem;
    }
`

const StyledLi = styled.li<StyledTreeViewProps>`
    cursor: pointer;
    display: ${(props) => (props.open ? 'flex' : 'none')};
    transition: width 0.2s;
    align-items: center;
    transition: width 0.2s, height 0.2s;
    min-height: 1.5rem;

    @media (min-width: 900px) {
        min-height: 3rem;
    }
`

const StyledCheckBox = styled(Checkbox) <{ theme?: Theme }>`
    @media (max-width: 900px) {
        padding: .5rem;

        &:lastchild {
            padding: .5rem;
        }
    }

    &.Mui-checked {
        color: ${(props) => props.theme.palette.text.primary} !important;
    }
`


interface recurseRes {
    selectNodes: number[];
    highlightParents: number[];
}

interface TreeState {
    selectedNodes: any[]
    highlightedParents: any[]
}

const TreeView: FC<TreeViewProps> = ({
    selectedFilters = [],
    preSelectedFilters = [],
    callNFTsEndpoint,
    setSelectedFilters,
    ...props
}) => {
    const [newCategorySelected, setNewCategorySelected] =
        useState<boolean>(false);
    const [highlightedParents, setHighlightedParents] = useState<number[]>(
        [],
    );

    const recurseChildrens = (node: any, isActionSelect: boolean, previouslySelectedNodes: any[]): recurseRes => {

        if (node.children?.length > 0) {
            let res: recurseRes = {
                selectNodes: [node.id],
                highlightParents: [],
            };
            for (const child of node.children) {
                const childRes = recurseChildrens(child, isActionSelect, previouslySelectedNodes);
                res.selectNodes = [...res.selectNodes, ...childRes.selectNodes];
                // Omit from highlightParents if action == select, and child node already selected (in this case it's already in prev state's highlight count)
                const wasChildNotSelected = previouslySelectedNodes.indexOf(child.id) === -1

                if ((isActionSelect && wasChildNotSelected) || (!isActionSelect && !wasChildNotSelected)) {
                    res.highlightParents = [
                        ...res.highlightParents,
                        ...childRes.highlightParents,
                    ];
                }
            }
            res.highlightParents = [...res.highlightParents, ...Array(res.selectNodes.length).fill(node.id)];

            return res;
        } else {
            const wasChildSelected = previouslySelectedNodes.indexOf(node.id) !== -1

            if (isActionSelect && wasChildSelected) {
                return {
                    selectNodes: [],
                    highlightParents: []
                }
            }

            return {
                selectNodes: [node.id],
                highlightParents: [],
            };
        }
    };

    const handleFlip = (node: any, treeState?: TreeState): TreeState => {
        let newTreeState;
        if (!treeState) {
            const isActionSelect = selectedFilters.indexOf(node.id) === -1;
            newTreeState = select(node, isActionSelect, { selectedNodes: selectedFilters, highlightedParents: highlightedParents })
            setSelectedFilters(newTreeState.selectedNodes)
            setHighlightedParents(newTreeState.highlightedParents)
        } else {
            const isActionSelect = treeState.selectedNodes.indexOf(node.id) === -1;
            newTreeState = select(node, isActionSelect, treeState)
        }

        return newTreeState
    }

    const select = (node: any, isActionSelect: boolean, treeState: TreeState): TreeState => {
        const recRes = recurseChildrens(node, isActionSelect, treeState.selectedNodes);

        let incrAboveHighlightCount = recRes.selectNodes.length;

        for (const parent of getParents(node)) {
            if (!isActionSelect) {
                recRes.selectNodes.push(parent);
                if (treeState.selectedNodes.indexOf(parent) > -1) {
                    //recRes.highlightParents.push(parent)
                    incrAboveHighlightCount += 1
                }
            }
            recRes.highlightParents = [
                ...recRes.highlightParents,
                ...Array(incrAboveHighlightCount).fill(parent),
            ];
        }

        if (isActionSelect) {
            treeState.selectedNodes = [
                ...treeState.selectedNodes.filter(
                    (id) => recRes.selectNodes.indexOf(id) === -1,
                ),
                ...recRes.selectNodes,
            ]

            treeState.highlightedParents = [
                ...treeState.highlightedParents,
                // ...treeState.highlightedParents.filter(
                //     (id) => recRes.selectNodes.indexOf(id) === -1,
                // ),
                ...recRes.highlightParents
            ]
        } else {
            treeState.selectedNodes = treeState.selectedNodes.filter(
                (filterId) => recRes.selectNodes.indexOf(filterId) === -1,
            )

            treeState.highlightedParents = listDifference(treeState.highlightedParents, recRes.highlightParents);
        }
        return treeState
    };

    const listDifference = (dadList: any[], babyList: any[]): any[] => {
        const dadListCopy = [...dadList];
        babyList.forEach((parent) => {
            const index = dadListCopy.indexOf(parent);

            if (index > -1) {
                dadListCopy.splice(index, 1);
            }
        });

        return dadListCopy;
    };

    // Add recursively all the parents to an array and return the array
    const getParents = (node: any, parents: any[] = []) => {
        if (node.parent) {
            parents.push(node.parent.id);
            getParents(node.parent, parents);
        }
        return parents;
    };

    const getNodeById = (node: any, nodeId: number, concernedNode: any = null, parent?: any) => {
        if (parent) {
            node.parent = parent
        }
        if (node.id === nodeId) {
            concernedNode = node
        }

        if (node.children) {
            node.children.map((child: any) => {
                if (child.id === nodeId) {
                    child.parent = node
                    concernedNode = child
                    return child
                }
                concernedNode = getNodeById(child, nodeId, concernedNode, node)
            })
        }
        if (concernedNode) {
            return concernedNode
        }
    }

    // Open or close childrens
    const handleListItemClick = (concernedRef: any) => {
        if (activeRef.indexOf(concernedRef) !== -1) {
            setActiveRef(activeRef.filter((ref) => ref !== concernedRef));
        } else {
            setActiveRef([...activeRef, concernedRef]);
        }
    };

    useEffect(() => {
        if (selectedFilters.length === 0) {
            setHighlightedParents([]);
        }
        if (newCategorySelected) {
            callNFTsEndpoint({ handlePriceRange: true });
            setNewCategorySelected(false);
        }
    }, [selectedFilters]);

    useEffect(() => {
        if (preSelectedFilters && props.nodes && props.nodes.length > 0) {
            setActiveRef([...preSelectedFilters]);

            let treeState: TreeState = {
                selectedNodes: [],
                highlightedParents: []
            }

            let concernedNodes: any[] = []
            preSelectedFilters.map(nodeId => concernedNodes.push(getNodeById(props.nodes![0], nodeId)))

            concernedNodes.map(node => {
                if (treeState.selectedNodes.indexOf(node.id) === -1) {
                    const newTreeState = handleFlip(node, treeState)
                    treeState.selectedNodes = newTreeState.selectedNodes
                    treeState.highlightedParents = newTreeState.highlightedParents
                }
            })

            setSelectedFilters(treeState.selectedNodes)
            setHighlightedParents(treeState.highlightedParents)
        }
    }, [props.nodes]);


    const countHighlightedParentOccurence = (nodeId: number, highlightedParents: number[]): number => {
        let c = 0
        for (const parentId of highlightedParents) {
            if (parentId === nodeId) {
                c++
            }
        }
        return c
    }

    const [activeRef, setActiveRef] = useState<any[]>([]);

    const renderTree: any = (parentNode: any, children: any) => {
        return children?.map((node: any) => {
            node.parent = parentNode;

            return (
                <StyledDiv
                    open={props.open}
                    style={{
                        paddingLeft: node.parent.id === 'root' ? '0' : '',
                    }}
                >
                    <StyledLi open={props.open} key={node.id}>
                        <Stack
                            direction="row"
                            sx={{ alignItems: 'center', width: '100%' }}
                        >
                            <StyledCheckBox
                                checked={
                                    selectedFilters.indexOf(node.id) !== -1
                                }
                                onClick={() => { handleFlip(node); setNewCategorySelected(true); }}
                                inputProps={{ 'aria-label': 'controlled' }}
                                disableRipple
                            />

                            <Stack
                                direction="row"
                                onClick={() => handleListItemClick(node.id)}
                                sx={{ width: '100%' }}
                            >
                                <Typography
                                    size="h5"
                                    weight="Light"
                                    color={
                                        highlightedParents.indexOf(
                                            node.id,
                                        ) !== -1 &&
                                            selectedFilters.indexOf(node.id) === -1
                                            ? 'contrastText'
                                            : ''
                                    }
                                >
                                    {node.name} - {countHighlightedParentOccurence(node.id, highlightedParents)}
                                </Typography>

                                <FlexSpacer />

                                {node.children?.length &&
                                    node.children?.length > 0 ? (
                                    activeRef.indexOf(node.id) !== -1 ? (
                                        <Typography size="h5" weight="Light">
                                            -
                                        </Typography>
                                    ) : (
                                        <Typography size="h5" weight="Light">
                                            +
                                        </Typography>
                                    )
                                ) : undefined}
                            </Stack>
                        </Stack>
                    </StyledLi>
                    {activeRef.indexOf(node.id) !== -1
                        ? renderTree(node, node.children)
                        : undefined}
                </StyledDiv>
            );
        });
    };

    return props.nodes && !props.collapsed ? (
        renderTree(props.nodes[0], props.nodes[0].children)
    ) : (
        <></>
    );
};

export default TreeView;
