import { Children, FC, useState } from 'react';
import styled from "@emotion/styled";
import PageWrapper from "../../design-system/commons/PageWrapper";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import { Grid, Stack, Theme } from "@mui/material";
import { Typography } from "../../design-system/atoms/Typography";
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';


export interface FaqProps {
    selectedTheme?: string;
    theme?: Theme;
}


const StyledAnchorLink = styled.a <{ theme?: Theme }>`
    color: ${props => props.theme.palette.text.primary};
    text-decoration: none;
    font-family: 'Poppins Medium' !important;
    font-size: .8rem;

    @media (max-width: 1100px) {
        height: 2rem;
    }

    &: {
        box-shadow: -2px 0 0 0 #003a54;
    }
`

const StyledStack = styled(Stack)`
  max-width: 100rem;
  width: 100%;
  height: 100%;
`
const StyledSection = styled.section`
scroll-margin-top: 20em;
`

const StyledNav = styled.nav`
    position: sticky!important;
    top: 10rem;
    left: 0;
    bottom: -28.125rem;

`
// TODO: Add offset 
// Scroll to position
//  const scrollToPosition = (el: any, offset?: any, left?: any, behavior?: any, block?: any) => {
//     const elementPosition = el.offsetTop - offset;

//     window.scroll({
//       top: elementPosition,
//       left,
//       behavior,      
//     });
//   };
// const scrollWithOffset = (el?: Element, offset?: any,) => {
//     scrollToPosition(el, offset, 0, 'smooth', 'start');
//   };



const Faq: FC<FaqProps> = () => {
    const { t } = useTranslation(['translation']);
    const [activeSection, setActiveSection] = useState(false);

    const faqItems = [
        {
            question: t('faq.01_question'),
            answer: t('faq.01_answer'),
            id: 'introduction'
        },
        {
            question: t('faq.02_question'),
            answer: t('faq.02_answer'),
            id: 'thread1'
        },
        {
            question: t('faq.03_question'),
            answer: t('faq.03_answer'),
            id: 'thread2'
        },
        {
            question: t('faq.04_question'),
            answer: t('faq.04_answer'),
            id: 'thread3'
        },
        {
            question: t('faq.05_question'),
            answer: t('faq.05_answer'),
            id: 'thread4'
        },
        {
            question: t('faq.06_question'),
            answer: t('faq.06_answer'),
            id: 'thread4'
        }
    ];



    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>
                <FlexSpacer minHeight={10} />

                <Grid container spacing={2} >

                    <Grid item xs={12} md={4} sx={{ position: 'relative' }}>
                        <StyledNav>
                            <Typography size="h2" weight='SemiBold'>{t('faq.headline')}</Typography>
                            <FlexSpacer minHeight={3} />

                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {faqItems.map((nav) => <>
                                    <li key={nav.id} >
                                        <StyledAnchorLink
                                            className={clsx(activeSection ? 'active' : '')}
                                            href={`#${nav.id}`}>
                                            {nav.question}
                                            {/* <li>{!Children ? <StyledAnchorLink className="anchor" href={`#${nav.id}`} >{nav.question}</StyledAnchorLink> : ''}</li> */}
                                        </StyledAnchorLink>
                                    </li>
                                </>
                                )
                                }
                            </ul>
                        </StyledNav>
                    </Grid>
                    <Grid item xs={12} md={8}>

                        {faqItems.map((node) => <>
                            <StyledSection id={node.id}>
                                <Typography size="h2" weight='SemiBold'>{node.question}</Typography>
                                <p>
                                    {node.answer}
                                </p>
                                <p>{t('common.lorenIpsumLong')}</p>
                                <p>{t('common.lorenIpsumLong')}</p>
                            </StyledSection>
                        </>
                        )
                        }
                    </Grid>
                </Grid>
            </StyledStack>
        </PageWrapper >
    )
}

export default Faq;