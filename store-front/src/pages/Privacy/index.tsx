import { FC } from 'react'
import styled from '@emotion/styled'
import PageWrapper from '../../design-system/commons/PageWrapper'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import CustomButton from '../../design-system/atoms/Button'
import {
    Grid,
    Stack,
    useMediaQuery,
    Theme,
    useTheme,
    Drawer,
} from '@mui/material'
import { Typography } from '../../design-system/atoms/Typography'
import { useTranslation } from 'react-i18next'

export interface PrivacyProps {
    selectedTheme?: string
    theme?: Theme
}

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

    .Privacy-content {
        @media (max-width:400px) {
            padding: 0 1.5rem;
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

const Privacy: FC<PrivacyProps> = () => {
    const { t } = useTranslation(['translation'])
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const privacyItems = [
        {
            headline: t('privacy.01_headline'),
            text: [t('privacy.01_text'), t('privacy.01_text2')],
            className: '',
            id: '#one',
        },
        {
            headline: t('privacy.01_1_headline'),
            text: [t('privacy.01_1_text')],
            className: 'sub',
            id: '#one_one',
        },
        {
            headline: t('privacy.01_2_headline'),
            text: [t('privacy.01_2_text')],
            className: 'sub',
            id: '#one_two',
        },
        {
            headline: t('privacy.02_headline'),
            text: [t('privacy.02_text')],
            className: '',
            id: '#two',
        },
        {
            headline: t('privacy.03_headline'),
            text: [t('privacy.03_text')],
            className: '',
            id: '#three',
        },
        {
            headline: t('privacy.03_1_headline'),
            text: [t('privacy.03_1_text'), t('privacy.03_1_text2')],
            className: 'sub',
            id: '#three_one',
        },
    ]

    return (
        <PageWrapper>
            <StyledStack direction="column" maxWidth="md">
                <FlexSpacer minHeight={12} />
                <Grid container className="privacy-nav">
                    <Grid
                        item
                        xs={12}
                        px={isMobile ? 3 : 12}
                        className="privacy-content"
                    >
                        <Typography
                            size="h1"
                            weight="SemiBold"
                            justifyContent={isMobile ? 'left' : 'center'}
                        >
                            {t('privacy.headline')}
                        </Typography>

                        <FlexSpacer minHeight={3} />

                        {privacyItems.map((node) => (
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

export default Privacy
