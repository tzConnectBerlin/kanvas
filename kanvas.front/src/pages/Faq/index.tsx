import React, { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import Scroll from 'react-scroll';
import styled from "@emotion/styled";
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import PageWrapper from "../../design-system/commons/PageWrapper";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import { Grid, Stack } from "@mui/material";
import { Typography } from "../../design-system/atoms/Typography";
import { common } from '@mui/material/colors';
import { useTranslation } from 'react-i18next';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import { LinkProps, NavLinkProps } from 'react-router-dom';

const StyledStack = styled(Stack)`
    overflow: hidden;
    max-width: 100rem;
    width: 100%;
    height: 100%;
`
export interface HashLinkProps extends LinkProps {
    elementId?: string | undefined;
    smooth?: boolean | undefined;
    scroll?: ((element: HTMLElement) => void) | undefined;
    timeout?: number | undefined;
  }
  
export interface NavHashLinkProps extends NavLinkProps, Omit<HashLinkProps, 'className' | 'style'> { }
 

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `1px solid rgba(29, 34, 39, 0.87)`,
    marginTop: 0,
    '&:not(style)+:not(style)': {
        marginTop: 0,
    },
    
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&:before': {
        display: 'none',
    },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
        {...props}
    />
))(({ theme }) => ({
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: '2rem',
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: '2rem',
    borderTop: '1px solid rgba(29, 34, 39, 0.87)',
}));

interface RenderTree {
    id: string;
    name: string;
    link: string;
    children?: readonly RenderTree[];
}

const data: RenderTree = {
    id: 'root',
    name: 'Parent',
    link: '/#faq-item-1',
    children: [
        {
            id: '1',
            name: 'Child - 1',
            link: '/#faq-item-2',
        },
        {
            id: '3',
            name: 'Child - 3',
            link: '/#faq-item-3',
            children: [
                {
                    id: '4',
                    name: 'Child - 4',
                    link: '/link',
                },
            ],
        },
    ],
};

const Faq = () => {
    const { t } = useTranslation(['translation']);

    const faqItems = [
        {
            question: t('faq.01_question'),
            answer: t('faq.01_response'),
            id: 'faq-item-1'
        },
        {
            question: t('faq.02_question'),
            answer: t('faq.02_response'),
            id: 'faq-item-2'
        },
        {
            question: t('faq.03_question'),
            answer: t('faq.03_response'),
            id: t('faq-item-3')
        },
        {
            question: t('faq.04_question'),
            answer: t('faq.04_response'),
            id: 'faq-item-4'
        },
        {
            question: t('faq.05_question'),
            answer: t('faq.05_response'),
            id: 'faq-item-5'
        }
    ];
    let Element = Scroll.Element;

    const scrollTo = (id: string) => {
        Scroll.scroller.scrollTo(id, {
            duration: 500,
            delay: 0,
            smooth: true,
            offset: -550
        })
    }

    const [expanded, setExpanded] = React.useState<string | false>('panel1');

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
        };

    const renderTree = (nodes: RenderTree) => ( 
        <TreeItem key={nodes.id} nodeId={nodes.id} onClick={() => scrollTo(nodes.link)}label={nodes.name}>
                    
                {Array.isArray(nodes.children)
                    ? nodes.children.map((node) => renderTree(node))
                    : null}
           
        </TreeItem> 
    );
    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>

                <FlexSpacer minHeight={10} />

                <Typography size="h1" weight='SemiBold' sx={{ justifyContent: 'center' }}> FAQ</Typography>

                <FlexSpacer minHeight={1} />

                <Grid container>
                    <Grid item xs={12} md={4}>
                        <TreeView
                            aria-label="Scrollspy"
                            defaultCollapseIcon={<ExpandMoreIcon />}
                            defaultExpanded={['root']}
                            defaultExpandIcon={<ChevronRightIcon />}
                            sx={{ height: 110, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                        >
                          
                                {renderTree(data)}
                         
                            
                        </TreeView>
                    </Grid>
                    <Grid item xs={12} md={8}>
                    <FlexSpacer minHeight={30} />
           

                        {faqItems.map((value) =>
                            <Element name={value.id}>
                                <Accordion expanded={expanded === value.id} onChange={handleChange(`${value.id}`)} >
                                    <AccordionSummary aria-controls="panel1d-content" id={value.id} key={value.id}>
                                        <Typography size="body" weight="SemiBold">{value.question}</Typography>
                                    </AccordionSummary>

                                    <AccordionDetails>
                                        <Typography size="body" weight="Light">
                                            {value.answer} - {t('common.lorenIpsumLong')}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            </Element>
                        )
                        }
                    </Grid>
                </Grid>

            </StyledStack>
        </PageWrapper>
    )
}

export default Faq;