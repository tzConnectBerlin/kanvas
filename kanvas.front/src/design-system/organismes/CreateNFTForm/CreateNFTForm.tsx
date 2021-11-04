import * as yup from 'yup';
import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import CustomButton from '../../atoms/Button';
import Typography from "../../atoms/Typography";
import FlexSpacer from '../../atoms/FlexSpacer';

import { useFormik } from 'formik';
import { FC, useEffect, useState } from "react";
import { DropZone } from '../../molecules/DropZone';
import { Badge, FormHelperText, Theme } from '@mui/material';
import { Box, TextField, InputAdornment, Stack } from '@mui/material';

interface CreatNFTFormProps {

}


const StyledStack = styled(Stack)`
    width: 100%;

    align-items: center;

    transition: all 0.2s;

    .MuiTextField-root {
        width: 100% !important;
    }
`

const StyledInput = styled(TextField)<{theme?: Theme, error?: boolean}>`

    .MuiInput-input {
        text-align: center;
        padding: 4px 0 1rem !important;
    }

    .MuiInput-root:after {
        border-bottom: 2px solid ${props => props.error? 'red' : props.theme.palette.primary.contrastText };
    }

    .MuiFormHelperText-root {
        text-align: center;
        font-family: 'Poppins Medium';
        font-size: 0.9rem;
        margin-top: 3rem !important;

        position: absolute;
    }
`


const validationSchema = yup.object({
    name: yup
        .string()
        .min(2, 'Name should be of minimum 2 characters length')
        .max(30, 'Name should be of maximum 30 characters length')
        .required('Name is required'),
    description: yup
        .string()
        .min(2, 'Description should be of minimum 2 characters length')
        .max(30, 'Description should be of maximum 30 characters length')
        .required('Description is required')
});

export const CreatNFTForm : FC<CreatNFTFormProps> = ({...props}) => {

    const [nftFile, setNftFile] = useState('')
    const [dropZoneErrorMessage, setDropZoneErrorMessage] = useState<string | null>(null)

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            metadata: {}
        },
        validationSchema: validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log('submit')
        },
    });

    return (
        <>
        <Box
            component="form"
            autoComplete="off"
        >
            <form onSubmit={formik.handleSubmit} >
                <StyledStack direction="column" spacing={5}>
                    <DropZone inputId='nftFile' height={10} fileUrl={nftFile} setFileUrl={setNftFile} setDropZoneErrorMessage={setDropZoneErrorMessage} error={dropZoneErrorMessage ? true : false} />

                    <FlexSpacer minWidth={2}/>

                    <StyledStack direction="column" spacing={4}>
                        <Typography size="h3" weight='Medium' align='center'> Name* </Typography>

                            <StyledInput
                                id='name'
                                name='name'
                                variant="standard"
                                placeholder="Type Here"
                                onBlur={formik.handleBlur}
                                onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('name', event.currentTarget.value) }}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                value={formik.values.name}
                                autoFocus
                            />

                    </StyledStack>

                    <FlexSpacer minWidth={2}/>

                    <StyledStack direction="column" spacing={4}>
                        <Typography size="h3" weight='Medium'> Description* </Typography>
                            <StyledInput
                                id='description'
                                name='description'
                                variant="standard"
                                placeholder="Type Here"
                                onBlur={formik.handleBlur}
                                onChange={(event) => { formik.handleChange(event); sessionStorage.setItem('description', event.currentTarget.value) } }
                                error={formik.touched.description && Boolean(formik.errors.description)}
                                helperText={formik.touched.description && formik.errors.description}
                                value={formik.values.description}
                            />
                    </StyledStack>

                    <FlexSpacer minHeight={2}/>

                    <CustomButton size="large" onClick={() => formik.handleSubmit()} label={'Submit'} sx={{width: '10rem'}} loading={false}/>

                    <FlexSpacer minHeight={5}/>
                </StyledStack>

            </form>
        </Box>

        </>
    )
}