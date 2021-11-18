import { FC } from 'react'
import styled from '@emotion/styled'
import PageWrapper from '../../design-system/commons/PageWrapper'
import FlexSpacer from '../../design-system/atoms/FlexSpacer'
import { Grid, Stack, Theme } from '@mui/material'
import { Typography } from '../../design-system/atoms/Typography'
import { useTranslation } from 'react-i18next'
import Scrollspy from 'react-scrollspy-ez'

export interface FaqProps {
  selectedTheme?: string
  theme?: Theme
}

const StyledAnchorLink = styled.a<{ theme?: Theme }>`
  color: ${(props) => props.theme.palette.text.primary};
  text-decoration: none;
  font-family: 'Poppins Medium' !important;
  font-size: 0.8rem;
  font-weight: 700;

  @media (max-width: 1100px) {
    height: 2rem;
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
    }

    li {
      padding-left: 1rem;
      margin-bottom: 0.4rem;
      min-height: 1.5rem;
      display: flex;
      align-items: center;
    }

    li + li {
      padding-left: 1rem;
    }
  }

  .faq-content {
    .MuiTypography-body2 {
      margin-bottom: 1rem;
    }
  }
`
const StyledSection = styled.section`
  margin-bottom: 4rem;
  // border-bottom: 1px solid #cdcbcb;

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
`

const StickyNav = styled.nav`
  position: sticky !important;
  top: 10rem;
  left: 0;
  bottom: -28.125rem;
`

const Faq: FC<FaqProps> = () => {
  const { t } = useTranslation(['translation'])

  const faqItems = [
    {
      headline: t('faq.01_headline'),
      text: t('faq.01_text'),
      className: '',
      id: '#one',
    },
    {
      headline: t('faq.01_1_headline'),
      text: t('faq.01_1_text'),
      className: 'sub',
      id: '#one_one',
    },
    {
      headline: t('faq.01_2_headline'),
      text: t('faq.01_2_text'),
      className: 'sub',
      id: '#one_two',
    },
    {
      headline: t('faq.02_headline'),
      text: t('faq.02_text'),
      className: '',
      id: '#two',
    },
    {
      headline: t('faq.03_headline'),
      text: t('faq.03_text'),
      className: '',
      id: '#three',
    },
    {
      headline: t('faq.03_1_headline'),
      text: t('faq.03_1_text'),
      className: 'sub',
      id: '#three_one',
    },
  ]

  return (
    <PageWrapper>
      <StyledStack direction="column" spacing={3}>
        <FlexSpacer minHeight={10} />

        <Grid container spacing={2} className="faq-nav">
          <Grid item xs={12} md={5} sx={{ position: 'relative' }}>
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

          <Grid item xs={12} md={7} className="faq-content">
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
                  <Typography size="body2" weight="Light">
                    {node.text}
                  </Typography>
                  <Typography size="body2" weight="Light">
                    {node.text}
                  </Typography>
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
