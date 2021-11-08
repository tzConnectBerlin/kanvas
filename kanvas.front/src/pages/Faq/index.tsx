import React, { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import styled from "@emotion/styled";
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import PageWrapper from "../../design-system/commons/PageWrapper";
import FlexSpacer from "../../design-system/atoms/FlexSpacer";
import { Stack } from "@mui/material";
import { Typography } from "../../design-system/atoms/Typography";

const StyledStack = styled(Stack)`
    overflow: hidden;
    max-width: 100rem;
    width: 100%;
    height: 100%;
`

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0}  square {...props} />
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

const Faq = () => {

    const [expanded, setExpanded] = React.useState<string | false>('panel1');

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
        };

    return (
        <PageWrapper>
            <StyledStack direction='column' spacing={3}>

                <FlexSpacer minHeight={10} />

                <Typography size="h1" weight='SemiBold' sx={{ justifyContent: 'center' }}> FAQ</Typography>

                <FlexSpacer minHeight={1} />

                <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                    <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
                        <Typography size="body" weight="SemiBold">Collapsible Group Item #1</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography size="body" weight="Light">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                            malesuada lacus ex, sit amet blandit leo lobortis eget. Lorem ipsum dolor
                            sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex,
                            sit amet blandit leo lobortis eget.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary aria-controls="panel2d-content" id="panel2d-header">
                        <Typography size="body" weight="SemiBold">Collapsible Group Item #2</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography size="body" weight="Light">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                            malesuada lacus ex, sit amet blandit leo lobortis eget. Lorem ipsum dolor
                            sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex,
                            sit amet blandit leo lobortis eget.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                    <AccordionSummary aria-controls="panel3d-content" id="panel3d-header">
                        <Typography size="body" weight="SemiBold">Collapsible Group Item #3</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography size="body" weight="Light">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                            malesuada lacus ex, sit amet blandit leo lobortis eget. Lorem ipsum dolor
                            sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex,
                            sit amet blandit leo lobortis eget.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </StyledStack>
        </PageWrapper>
    )
}

export default Faq;