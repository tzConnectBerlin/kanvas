import { FC } from 'react';
import styled from "@emotion/styled";
import PageWrapper from "../../design-system/commons/PageWrapper";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import { Grid, Stack, Theme } from "@mui/material";
import { Typography } from "../../design-system/atoms/Typography";
import { useTranslation } from 'react-i18next';
import Scrollspy from "react-scrollspy-ez";

export interface FaqProps {
    selectedTheme?: string;
    theme?: Theme;
}

const StyledAnchorLink = styled.a <{ theme?: Theme }>`
    color: ${props => props.theme.palette.text.primary};
    text-decoration: none;
    font-family: 'Poppins Medium' !important;
    font-size: .8rem;
    font-weight: 700;

    @media (max-width: 1100px) {
        height: 2rem;
    }

`

const SlyledListItem = styled.li <{ theme?: Theme }>`
        padding-left: 1rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
`

const StyledStack = styled(Stack) <{theme?: Theme}>`
    max-width: 100rem;
    width: 100%;
    height: 100%;

    .scrollspy {
        padding-left: 0;
    }

    .isCurrent {
        font-weight: 900;
        box-shadow: -2px 0 0 0 ${props => props.theme.palette.text.primary};

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
    position: sticky!important;
    top: 10rem;
    left: 0;
    bottom: -28.125rem;
`


const Faq: FC<FaqProps> = () => {
    const { t } = useTranslation(['translation']);

    // const faqItems = [
    //     {
    //         headline: t('faq.01_headline'),
    //         text: t('faq.01_text'),
    //         className: '',
    //         id: '#one'
    //     },
    //     {
    //         headline: t('faq.01_1_headline'),
    //         text: t('faq.01_1_text'),
    //         className: 'sub',
    //         id: '#one_one'
    //     },
    //     {
    //         headline: t('faq.01_2_headline'),
    //         text: t('faq.01_2_text'),
    //         className: 'sub',
    //         id: '#one_two'
    //     },
    //     {
    //         headline: t('faq.02_headline'),
    //         text: t('faq.02_text'),
    //         className: '',
    //         id: '#two'
    //     },
    //     {
    //         headline: t('faq.03_headline'),
    //         text: t('faq.03_text'),
    //         className: '',
    //         id: '#three'
    //     }
    // ];

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>
                <FlexSpacer minHeight={10} />

                <Grid container spacing={2} >
                    <Grid item xs={12} md={5} sx={{ position: 'relative' }}>
                        <StickyNav>
                            <Scrollspy
                                ids={["one", "one_one", "one_two", "two", "three"]}
                                itemContainerClassName="scrollNavContainer"
                                activeItemClassName="isCurrent"
                                itemClassName="navItemClass"
                                includeParentClasses={true}
                                itemElement={<li className="MuiTypography-root MuiTypography-body" />}
                            />

                            {/* {faqItems.map((nav) => <>
                                    <li key={nav.id} >
                                        <a href={nav.id}>
                                            {nav.headline}
                                        </a>
                                    </li>
                                </>
                                )
                                } */}

                        </StickyNav>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Typography size="h1" weight='SemiBold'>{t('faq.headline')}</Typography>
                        <FlexSpacer minHeight={3} />
                                
                        {/* {faqItems.map((node) => <>
                            <StyledSection >
                                <Typography id={node.id}size="h2" weight='SemiBold' className={node.className}>
                                    {node.headline}
                                </Typography>
                                <Typography size="body" weight='Light' >
                                    {node.text}
                                    <br />
                                    What is Lorem Ipsum? Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Why do we use it? It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like). Where does it come from? Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham. Where can I get some? There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.
                                </Typography>    
                            </StyledSection>
                        </>
                        )
                        }                        
                        /* */}

                        <StyledSection>
                            <Typography id="one" size="h2" weight='SemiBold' >
                                {t('faq.01_headline')}
                            </Typography>
                            <Typography size="body" weight='Light'>
                                {t('faq.01_text')}
                                {t('common.lorenIpsumLong')}
                            </Typography>
                        </StyledSection>

                        <StyledSection>
                            <Typography id="one_one" size="h2" className="sub" weight='SemiBold'>
                                {t('faq.01_1_headline')}
                            </Typography>
                            <Typography size="body" weight='Light'>
                                {t('faq.01_1_text')}
                                {t('common.lorenIpsumLong')}
                            </Typography>
                        </StyledSection>

                        <StyledSection>
                            <Typography id="one_two" size="h2" className="sub" weight='SemiBold'>
                                {t('faq.01_2_headline')}
                            </Typography>
                            <Typography size="body" weight='Light'>
                                {t('faq.01_2_text')}
                                {t('common.lorenIpsumLong')}
                            </Typography>
                        </StyledSection>

                        <StyledSection>
                            <Typography id="two" size="h2" weight='SemiBold' >
                                {t('faq.02_headline')}
                            </Typography>
                            <Typography size="body" weight='Light'>
                                {t('faq.02_text')}
                                {t('common.lorenIpsumLong')}
                            </Typography>
                        </StyledSection>

                        <StyledSection>
                            <Typography id="three" size="h2" weight='SemiBold'>
                                {t('faq.03_headline')}
                            </Typography>
                            <Typography size="body" weight='Light'>
                                {t('faq.03_text')}
                                {t('common.lorenIpsumLong')}
                            </Typography>
                        </StyledSection>
                    </Grid>
                </Grid>
            </StyledStack>

        </PageWrapper >
    )
}

export default Faq;