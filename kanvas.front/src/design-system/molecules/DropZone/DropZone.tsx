import styled from '@emotion/styled';
import CustomButton from '../../atoms/Button';
import Typography from '../../atoms/Typography';

import { Stack, Theme } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Avatar from '../../atoms/Avatar';
import { ClearRounded } from '@mui/icons-material';

interface StyledDropZoneProps {
    error: boolean;
    theme?: Theme;
    height?: number;
    width?: number;
}

interface DropZoneProps extends StyledDropZoneProps {
    setFileUrl: Function;
    setDropZoneErrorMessage: Function;
    inputId: string;
    fileUrl: string;
}

const StyledZone = styled.div<StyledDropZoneProps>`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: ${props => props.height ? props.height : 11}rem;
    width: 100%;
    border: 2px dashed ${props => props.error ? props.theme.palette.error.main : '#C4C4C4' };

    outline: none;

    h5 {
        width: 70% !important;
    }

    :focus {
        border: 2px dashed ${props => props.error ? props.theme.palette.error.main : props.theme.palette.primary.contrastText };
    }
`

const StyledStack = styled(Stack)`
    align-items: center;
    justify-content: center;
    padding-bottom: 2rem;
    padding-top: 2rem;
    height: 100%;
    position: relative;

    button {
        width: 90%;
    }
`

const StyledAvataWrapper = styled.div`
    position: relative;
`

const ClearContentWrapper =  styled.div<{theme?: Theme}>`
    height: 2rem;
    width: 2rem;


    position: absolute;
    right: 0;

    display: flex;
    justify-content: center;
    align-items: center;

    z-index: 5;

    background-color: ${props => props.theme.palette.background.default};

    transition: filter 0.2s;

    cursor: pointer;

    :hover {
        transition: filter 0.2s;
        outline: ${props => `solid 2px ${props.theme.palette.text.primary}`};
    }

    :active {
        filter: drop-shadow(0px 0px 6px #98989833);
    }
`

const StyledClearContent = styled(ClearRounded)<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary};
`

export const DropZone : FC<DropZoneProps> = ({setFileUrl, setDropZoneErrorMessage, ...props}) => {

    const blobToBase64 = (blob: Blob) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
                resolve(reader.result);
            };
        });
    };

    const onDrop = useCallback(async acceptedFiles => {
        const file : File = acceptedFiles[0]
        const size : number = file.size

        // If file bigger than 2Mb, reject file
        if ( size > 2000000) {
            setDropZoneErrorMessage('File should be smaller than 2Mb')
            return
        }

        if (file.type.slice(0, 5) ===  "image") {

            // For video later

            var reader = new FileReader();
            reader.readAsArrayBuffer(file)

            reader.onload = async (event: any) => {
                try {
                    // The file reader gives us an ArrayBuffer:
                    let buffer = event.target.result;

                    // We have to convert the buffer to a blob:
                    let blob = new Blob([new Uint8Array(buffer)], { type: 'video/mp4' });

                    // The blob gives us a URL to the video file:
                    let url = window.URL.createObjectURL(blob);

                    // Set error to false
                    setDropZoneErrorMessage(false)
                    // Set the file to parent component
                    setFileUrl(url)

                    // Saving the blob in the sessionStorage to prevent user from reimporting data
                    const b64 = await blobToBase64(blob);
                    let b64String = JSON.stringify({blob: b64})

                    sessionStorage.setItem(`${props.inputId}`, b64String)

                } catch (e) {
                    setDropZoneErrorMessage('An unexpected error occured, We receive a notificaiton and are working on it')
                    setDropZoneErrorMessage(true)
                }
            }
        } else {
            setDropZoneErrorMessage('Only Png, Gif, JPG, TIF are accepted')
        }
    }, [])

    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <StyledZone {...getRootProps()} error={props.error}>
            <input {...getInputProps()} />

            <StyledStack direction="column" spacing={5}>
                {
                    props.fileUrl ?
                        <StyledAvataWrapper>
                            <ClearContentWrapper onClick={() => setFileUrl('')}>
                                <StyledClearContent />
                            </ClearContentWrapper>
                            <img src={props.fileUrl}/>
                        </StyledAvataWrapper>
                    :
                        <Typography size="h5" weight='Light' color="#C4C4C4" align="center" sx={{marginTop: '1rem'}}> Drag and Drop an image here </Typography>
                }

                <CustomButton size="medium" onClick={getInputProps} label={props.fileUrl === '' ? 'Choose file' : 'Edit file' } />
            </StyledStack>
        </StyledZone>
    )
}