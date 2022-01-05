import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';

import { Checkbox, Stack, Theme } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { IParamsNFTs, ITreeCategory } from '../../../pages/StorePage';

interface StyledTreeViewProps {
    open?: boolean;
    theme?: Theme;
}

interface TreeViewProps extends StyledTreeViewProps {
    nodes?: ITreeCategory[];
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
    min-height: 2.7rem;
`;

const StyledLi = styled.li<StyledTreeViewProps>`
    cursor: pointer;
    display: ${(props) => (props.open ? 'flex' : 'none')};
    transition: width 0.2s;
    align-items: center;
    transition: width 0.2s, height 0.2s;
    min-height: 2.7rem;
`;

const StyledCheckBox = styled(Checkbox)<{ theme?: Theme }>`
    @media (max-width: 900px) {
        padding: 0.5rem;

        &:lastchild {
            padding: 0.5rem;
        }
    }

    &.Mui-checked {
        color: ${(props) =>
            props.theme.palette.primary.contrastText} !important;
    }

    &.MuiCheckbox-indeterminate {
        color: ${(props) =>
            props.theme.palette.primary.contrastText} !important;
    }
`;

const StyledStack = styled(Stack)<{ theme?: Theme; selected: boolean }>`
    align-items: center;
    width: 100%;
    /* border-left: ${(props) =>
        props.selected
            ? `2px solid ${props.theme.palette.primary.contrastText}`
            : 'none'}; */
    height: 2rem;
`;

interface recurseRes {
    flipNodes: number[];
    deltaHighlightParents: number[];
}

interface TreeState {
    selectedNodes: any[];
    highlightedParents: any[];
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
    const [highlightedParents, setHighlightedParents] = useState<number[]>([]);

    const recurseChildrens = (
        node: any,
        isActionSelect: boolean,
        previouslySelectedNodes: any[],
    ): recurseRes => {
        const wasSelected = previouslySelectedNodes.indexOf(node.id) !== -1;

        let res: recurseRes = {
            flipNodes:
                (isActionSelect && !wasSelected) ||
                (!isActionSelect && wasSelected)
                    ? [node.id]
                    : [],
            deltaHighlightParents: [],
        };

        if (node.children?.length > 0) {
            for (const child of node.children) {
                const childRes = recurseChildrens(
                    child,
                    isActionSelect,
                    previouslySelectedNodes,
                );
                res.flipNodes = [...res.flipNodes, ...childRes.flipNodes];

                res.deltaHighlightParents = [
                    ...res.deltaHighlightParents,
                    ...childRes.deltaHighlightParents,
                ];
            }
            res.deltaHighlightParents = [
                ...res.deltaHighlightParents,
                ...Array(res.flipNodes.length).fill(node.id),
            ];
        }
        return res;
    };

    const handleFlip = (
        node: ITreeCategory,
        treeState?: TreeState,
    ): TreeState => {
        let newTreeState;
        const isActionSelect =
            selectedFilters.indexOf(node.id as number) === -1;

        if (!treeState) {
            newTreeState = select(node, isActionSelect, {
                selectedNodes: selectedFilters,
                highlightedParents: highlightedParents,
            });
            setSelectedFilters(newTreeState.selectedNodes);
            setHighlightedParents(newTreeState.highlightedParents);
        } else {
            newTreeState = select(node, isActionSelect, treeState);
        }

        return newTreeState;
    };

    const select = (
        node: ITreeCategory,
        isActionSelect: boolean,
        treeState: TreeState,
    ): TreeState => {
        const recRes = recurseChildrens(
            node,
            isActionSelect,
            treeState.selectedNodes,
        );

        let incrAboveHighlightCount = recRes.flipNodes.length;

        for (const parent of getParents(node)) {
            if (!isActionSelect) {
                recRes.flipNodes.push(parent);
                if (treeState.selectedNodes.indexOf(parent) > -1) {
                    incrAboveHighlightCount += 1;
                }
            }
            recRes.deltaHighlightParents = [
                ...recRes.deltaHighlightParents,
                ...Array(incrAboveHighlightCount).fill(parent),
            ];
        }

        if (isActionSelect) {
            treeState.selectedNodes = [
                ...treeState.selectedNodes.filter(
                    (id) => recRes.flipNodes.indexOf(id) === -1,
                ),
                ...recRes.flipNodes,
            ];

            treeState.highlightedParents = [
                ...treeState.highlightedParents,
                ...recRes.deltaHighlightParents,
            ];
        } else {
            treeState.selectedNodes = treeState.selectedNodes.filter(
                (filterId) => recRes.flipNodes.indexOf(filterId) === -1,
            );

            treeState.highlightedParents = listDifference(
                treeState.highlightedParents,
                recRes.deltaHighlightParents,
            );
        }
        return treeState;
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
    const getParents = (node: ITreeCategory, parents: any[] = []) => {
        if (node.parent) {
            parents.push(node.parent.id);
            getParents(node.parent, parents);
        }
        return parents;
    };

    const getNodeById = (
        node: ITreeCategory,
        nodeId: number,
        concernedNode: ITreeCategory | undefined = undefined,
        parent?: ITreeCategory,
    ) => {
        if (parent) {
            node.parent = parent;
        }
        if (node.id === nodeId) {
            concernedNode = node;
        }

        if (node.children) {
            node.children.map((child: ITreeCategory) => {
                if (child.id === nodeId) {
                    child.parent = node;
                    concernedNode = child;
                    return child;
                }
                concernedNode = getNodeById(child, nodeId, concernedNode, node);
            });
        }
        if (concernedNode) {
            return concernedNode;
        }
    };

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
            callNFTsEndpoint({ handlePriceRange: false });
            setNewCategorySelected(false);
        }
    }, [selectedFilters]);

    useEffect(() => {
        if (preSelectedFilters && props.nodes && props.nodes.length > 0) {
            setActiveRef([...preSelectedFilters]);

            const treeState: TreeState = {
                selectedNodes: [],
                highlightedParents: [],
            };

            const concernedNodes: any[] = [];
            preSelectedFilters.map((nodeId) =>
                concernedNodes.push(getNodeById(props.nodes![0], nodeId)),
            );

            concernedNodes.map((node) => {
                if (treeState.selectedNodes.indexOf(node.id) === -1) {
                    const newTreeState = handleFlip(node, treeState);
                    treeState.selectedNodes = newTreeState.selectedNodes;
                    treeState.highlightedParents =
                        newTreeState.highlightedParents;
                }
            });

            setSelectedFilters(treeState.selectedNodes);
            setHighlightedParents(treeState.highlightedParents);
            setNewCategorySelected(true)
        }
    }, [props.nodes, preSelectedFilters]);

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
                        <StyledStack
                            direction="row"
                            selected={
                                highlightedParents.indexOf(node.id) !== -1 &&
                                selectedFilters.indexOf(node.id) === -1
                            }
                        >
                            <StyledCheckBox
                                checked={
                                    selectedFilters.indexOf(node.id) !== -1
                                }
                                indeterminate={
                                    highlightedParents.indexOf(node.id) !== -1
                                }
                                onClick={() => {
                                    handleFlip(node);
                                    setNewCategorySelected(true);
                                }}
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
                                    weight={
                                        (highlightedParents.indexOf(node.id) !==
                                            -1 &&
                                            selectedFilters.indexOf(node.id) ===
                                                -1) ||
                                        selectedFilters.indexOf(node.id) !== -1
                                            ? 'SemiBold'
                                            : 'Light'
                                    }
                                >
                                    {node.name}
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
                        </StyledStack>
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
