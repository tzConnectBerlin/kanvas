import styled from '@emotion/styled'
import FlexSpacer from '../../atoms/FlexSpacer'
import Typography from '../../atoms/Typography'
import TreeView from '../../molecules/TreeView/TreeView'
import { Stack, Theme, useMediaQuery } from '@mui/material'
import { FC, useEffect, useState } from 'react'
import PriceFilter from '../../molecules/PriceFilter'
import CustomButton from '../../atoms/Button'
import { useTheme } from '@mui/system'
import { ArrowBackIosNew } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { reverse } from 'dns'

interface FilterProps {
    name: string
    collapsed: boolean
    setCollapsed: Function
    active: boolean
}

const StyledStack = styled(Stack)`
    align-items: center;
    width: 100%;
    padding-bottom: 1rem;
`

const Filter: FC<FilterProps> = ({ ...props }) => {
    return (
        <StyledStack
            direction="row"
            onClick={() => props.setCollapsed(props.name)}
        >
            <Typography
                size="h5"
                weight={props.active ? 'SemiBold' : 'Medium'}
                color={props.active ? 'contrastText' : ''}
            >
                {props.name}
            </Typography>

            <FlexSpacer />

            {props.collapsed ? (
                <Typography size="h5" weight="Light">
                    +
                </Typography>
            ) : (
                <Typography size="h5" weight="Light">
                    -
                </Typography>
            )}
        </StyledStack>
    )
}

interface StyledStoreFiltersProps {
    openFilters?: boolean
    collapsed?: boolean
    theme?: Theme
}

interface StoreFiltersProps extends StyledStoreFiltersProps {
    selectedFilters: number[]
    setSelectedFilters: Function
    availableFilters: any[]
    filterFunction: Function
    loading: boolean
    priceFilterRange: [number, number]
    setPriceFilterRange: Function
    minRange: number
    maxRange: number
    setFilterOpen: Function
}
const BackButton = styled(ArrowBackIosNew)<StyledStoreFiltersProps>`
    fill: ${(props) => props.theme.palette.text.primary};
`

const StyledSection = styled.section<StyledStoreFiltersProps>`
    @media (max-width: 874px) {
        flex-direction: column;
        display: none;
        max-width: ${(props) => (props.openFilters ? 100 : 0)}rem;
        width: ${(props) => (props.openFilters ? 100 : 0)}%;
        display: flex;
        height: 100vh;
        position: fixed;
        left: 0;
        top: 5rem;
        bottom: 0;
        z-index: 999999;

        overflow: auto;

        margin-top: 0 !important;
        padding-top: 1rem !important;

        padding-bottom: 2.5rem;

        background-color: ${(props) => props.theme.palette.background.paper};
        opacity: 1;

        p,
        a {
            opacity: ${(props) => (props.openFilters ? 1 : 0)} !important;
            transition: opacity 0.3s;
        }

        transition: max-width 0.3s, width 0.3s, padding 0.5s;
    }

    @media (max-width: 650px) {
        width: ${(props) => (props.openFilters ? 100 : 0)}%;
    }

    display: block;
    position: relative;

    padding: 0 0;
    transition: width 0.2s;

    width: ${(props) => (props.openFilters ? '25rem' : '0')};
    margin-right: ${(props) => (props.openFilters ? '2.5rem' : '0')};
`

const StyledUl = styled.ul<StyledStoreFiltersProps>`
    display: flex;
    flex-direction: column;
    height: 80vh;
    width: initial;
    padding: 0 0;
    transition: width 0.2s;
    padding: 0 1.5rem;

    @media (min-width: 900px) {
        height: fit-content;
        width: ${(props) => (props.openFilters ? '25rem' : '90%')};
        margin-right: ${(props) => (props.openFilters ? '2.5rem' : '0')};
    }
`
const StyledLi = styled.li<StyledStoreFiltersProps>`
    cursor: pointer;

    display: ${(props) => (props.openFilters ? 'flex' : 'none')};
    padding-top: 1rem;
    flex-direction: column;

    border-top: 1px solid #c4c4c4;

    height: auto;
`

export const StoreFilters: FC<StoreFiltersProps> = ({ children, ...props }) => {
    const [activeRef, setActiveRef] = useState<string[]>([])
    const { t } = useTranslation(['translation'])

    const handleListItemClick = (concernedRef: string) => {
        if (activeRef.indexOf(concernedRef) !== -1) {
            setActiveRef(
                activeRef.filter((ref: string) => ref !== concernedRef),
            )
        } else {
            setActiveRef([...activeRef, concernedRef])
        }
    }
    const theme = useTheme()

    const isMobile = useMediaQuery('(max-width:900px)')

    useEffect(() => {
        if (isMobile) {
            props.setFilterOpen(false)
        }
    }, [])

    useEffect(() => {
        if (props.openFilters) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
    }, [props.openFilters])

    return (
        <StyledSection openFilters={props.openFilters}>
            {isMobile && (
                <Stack direction="row" p=".5rem  1.5rem 0 1.5rem">
                    <BackButton
                        fill="#fff"
                        onClick={() => props.setFilterOpen(false)}
                        sx={{ cursor: 'pointer' }}
                    />

                    <Typography
                        onClick={() => props.setSelectedFilters([])}
                        size="h2"
                        ml={2}
                        weight={
                            props.selectedFilters.length > 0
                                ? 'Medium'
                                : 'Light'
                        }
                        sx={{ lineHeight: 1.1 }}
                    >
                        Filters
                    </Typography>
                </Stack>
            )}
            <StyledUl>
                <Stack
                    direction="row"
                    sx={{ display: `${props.openFilters ? 'flex' : 'none'}` }}
                >
                    <FlexSpacer />
                    <Typography
                        onClick={() => props.setSelectedFilters([])}
                        size="subtitle2"
                        weight={
                            props.selectedFilters.length > 0
                                ? 'Medium'
                                : 'Light'
                        }
                        color={
                            props.selectedFilters.length > 0
                                ? 'contrastText'
                                : '#C4C4C4'
                        }
                        sx={{ paddingBottom: '0.5rem' }}
                    >
                        Clear All
                    </Typography>
                </Stack>
                <StyledLi
                    openFilters={props.openFilters}
                    collapsed={activeRef.indexOf('Categories') !== -1}
                >
                    <Filter
                        name="Categories"
                        collapsed={activeRef.indexOf('Categories') !== -1}
                        active={props.selectedFilters.length > 0}
                        setCollapsed={handleListItemClick}
                    />
                    <TreeView
                        loading={props.loading}
                        open={props.openFilters}
                        nodes={props.availableFilters}
                        filterFunction={props.filterFunction}
                        selectedFilters={props.selectedFilters}
                        setSelectedFilters={props.setSelectedFilters}
                        collapsed={activeRef.indexOf('Categories') !== -1}
                    />
                </StyledLi>
                <StyledLi openFilters={props.openFilters}>
                    <Filter
                        name="Price"
                        active={false}
                        collapsed={activeRef.indexOf('Price') !== -1}
                        setCollapsed={handleListItemClick}
                    />

                    {activeRef.indexOf('Price') === -1 && (
                        <PriceFilter
                            minRange={props.minRange}
                            maxRange={props.maxRange}
                            range={props.priceFilterRange}
                            setRange={props.setPriceFilterRange}
                        />
                    )}
                </StyledLi>

                {isMobile && (
                    <>
                        <FlexSpacer borderBottom={false} minHeight={2} />
                        <Stack direction="column-reverse">
                            <CustomButton
                                fullWidth={true}
                                color="secondary"
                                type="submit"
                                label={t('filters.button.results')}
                                onClick={() => props.setFilterOpen(false)}
                                style={{
                                    order: isMobile ? 99 : 0,
                                    color: theme.palette.primary.main,
                                    alignSelf: 'flex-start',
                                    marginTop: 'auto',
                                }}
                            ></CustomButton>

                            <FlexSpacer minHeight={2} />

                            <CustomButton
                                fullWidth={!!isMobile}
                                color="secondary"
                                type="submit"
                                onClick={() => props.setSelectedFilters([])}
                                label={t('filters.button.reset')}
                                style={{
                                    outline: 'none',
                                }}
                            ></CustomButton>
                        </Stack>
                    </>
                )}
            </StyledUl>
        </StyledSection>
    )
}
