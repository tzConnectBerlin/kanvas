import { FC, useState } from 'react'
import styled from '@emotion/styled'
import PageWrapper from '../../design-system/commons/PageWrapper'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import CustomButton from '../../design-system/atoms/Button'
import {
    Grid,
    Tooltip,
    Stack,
    useMediaQuery,
    Theme,
    useTheme,
    Drawer,
} from '@mui/material'
import { Typography } from '../../design-system/atoms/Typography'
import { useTranslation } from 'react-i18next'
import Scrollspy from 'react-scrollspy-ez'
import ListIcon from '@mui/icons-material/List'
import ClickAwayListener from '@mui/material/ClickAwayListener'

export interface FaqProps {
    selectedTheme?: string
    theme?: Theme
}

const StyledIconButton = styled(CustomButton)`
    padding: 0;
    min-width: 1.5rem;
    height: 1.5rem !important;

    &:hover {
        background-color: rgba(0, 0, 0, 0);
    }
`

const StyledStack = styled(Stack)<{ theme?: Theme }>`
  max-width: 100rem;
  width: 100%;
  height: 100%;

  .scrollspy {
    padding-left: 0;
  }

  .isCurrent {
    font-weight: 900;
    box-shadow: -2px 0 0 0 ${(props) => props.theme.palette.text.primary};

    &:li + li {
      box-shadow: -2px 0 0 0 #003a54;
    }
  }

  .isCurrent a span {
    font-weight: bold;
  }

  .navItemClass.sub {
    margin-left: 10px;
  }

  .scrollNavContainer {
    padding: 0;

    .MuiTypography-root.MuiTypography-h2 {
      font-size: 0.85rem;
      font-family: Poppins Light;
      padding: .5rem 0 .4rem 1rem;
    }
    
    .navItemClass.sub {
      margin-left: 10px;    
    }
    
    .scrollNavContainer {
        padding: 0;

        &.isMobile {
            position: fixed;
            top: 0;
            right: 0;
            padding: 8px;
        }
        
        .MuiTypography-root.MuiTypography-h2 {
            font-size: .85rem;
            font-family: Poppins Light;
        }

        li {
            padding-left: 1rem;
            margin-bottom: .4rem;
            min-height: 1.5rem;
            display: flex;
            align-items: center;
        }

        li + li {
            padding-left: 1rem;
        }
    }
  }

    .faq-content {
        @media (max-width:400px) {
            padding: 0 2.2rem;
        }                  
    }
  }
`
const StyledSection = styled.section`
    margin-bottom: 4rem;

    h2 {
        scroll-margin-top: 4.7em;
        margin-bottom: 3rem;

        &.sub {
            margin-bottom: 2rem;
            font-size: 1rem;

            &:last-child {
                color: red;
            }
        }
    }
    .MuiTypography-body2 {
        margin-bottom: 1rem;
    }
`

const StickyNav = styled.nav`
    position: sticky;
    top: 10rem;
    left: 0;
    bottom: -28.125rem;
`

const StyledDrawer = styled(Drawer)<{ theme?: Theme }>`
    .MuiDrawer-paper {
        padding: 1.9rem 1.9rem 0 1.9rem;
    }
`

const Faq: FC<FaqProps> = () => {
    const { t } = useTranslation(['translation'])
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const [open, setOpen] = useState(true)

    const onClickToggler = () => {
        setOpen(!open)
    }

    const faqItems = [
        {
            headline: t('faq.01_headline'),
            text: [t('faq.01_text'), t('faq.01_text2')],
            className: '',
            id: '#one',
        },
        {
            headline: t('faq.01_1_headline'),
            text: [t('faq.01_1_text')],
            className: 'sub',
            id: '#one_one',
        },
        {
            headline: t('faq.01_2_headline'),
            text: [t('faq.01_2_text')],
            className: 'sub',
            id: '#one_two',
        },
        {
            headline: t('faq.02_headline'),
            text: [t('faq.02_text')],
            className: '',
            id: '#two',
        },
        {
            headline: t('faq.03_headline'),
            text: [t('faq.03_text')],
            className: '',
            id: '#three',
        },
        {
            headline: t('faq.03_1_headline'),
            text: [t('faq.03_1_text'), t('faq.03_1_text2')],
            className: 'sub',
            id: '#three_one',
        },
    ]

    return (
        <PageWrapper>
            <StyledStack direction="column">
                <FlexSpacer minHeight={10} />
                
                <Grid
                    container
                    className="faq-nav"
                    onClick={() => setOpen(false)}
                >
                    {isMobile ? (
                        <ClickAwayListener onClickAway={() => setOpen(false)}>
                            <>
                                <StyledDrawer
                                    anchor="bottom"
                                    open={open}
                                    onClose={onClickToggler}
                                    variant="persistent"
                                >
                                    <Scrollspy
                                        ids={faqItems.map((item) => item.id)}
                                        itemContainerClassName="scrollNavContainer"
                                        activeItemClassName="isCurrent"
                                        itemClassName="navItemClass"
                                        includeParentClasses={true}
                                        containerElement={
                                            <ul
                                                onClick={() => setOpen(false)}
                                                style={{
                                                    paddingBottom: '2rem',
                                                }}
                                            />
                                        }
                                        itemElement={
                                            <li className="MuiTypography-root MuiTypography-body2" />
                                        }
                                    />
                                </StyledDrawer>

                                <Tooltip title={'toggle'}>
                                    <StyledIconButton
                                        label=""
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            onClickToggler()
                                        }}
                                        icon={
                                            <ListIcon
                                                sx={{
                                                    color: 'black',
                                                    width: '.99rem',
                                                }}
                                            />
                                        }
                                        color="primary"
                                        aria-label="show hide"
                                        sx={{
                                            position: 'fixed',
                                            bottom: '.65rem',
                                            left: '.65rem',
                                            padding: '0',
                                            margin: '0',
                                            zIndex: 999,
                                        }}
                                    />
                                </Tooltip>
                            </>
                        </ClickAwayListener>
                    ) : (
                        <Grid
                            item
                            xs={12}
                            md={5}
                            lg={4}
                            sx={{ position: 'relative' }}
                        >
                            <StickyNav>
                                <Scrollspy
                                    ids={faqItems.map((item) => item.id)}
                                    itemContainerClassName="scrollNavContainer"
                                    activeItemClassName="isCurrent"
                                    itemClassName="navItemClass"
                                    includeParentClasses={true}
                                    itemElement={
                                        <li className="MuiTypography-root MuiTypography-body2" />
                                    }
                                />
                            </StickyNav>
                        </Grid>
                    )}

                    <Grid
                        item
                        xs={12}
                        md={7}
                        lg={8}
                        px={isMobile ? 3 : 0}
                        className="faq-content"
                    >
                        <Typography size="h1" weight="SemiBold">
                            {t('faq.headline')}
                        </Typography>

                        <FlexSpacer minHeight={3} />

                        {faqItems.map((node) => (
                            <>
                                <StyledSection>
                                    <Typography
                                        id={node.id}
                                        size="h2"
                                        weight="SemiBold"
                                        className={node.className}
                                    >
                                        {node.headline}
                                    </Typography>
                                    {node.text.map((p) => (
                                        <Typography
                                            size="body2"
                                            weight="Light"
                                            className={node.className}
                                        >
                                            {p}
                                        </Typography>
                                    ))}
                                </StyledSection>
                            </>
                        ))}
                    </Grid>
                </Grid>
            </StyledStack>
        </PageWrapper>
    )
}

export default Faq
