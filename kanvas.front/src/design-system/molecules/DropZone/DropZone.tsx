import styled from '@emotion/styled';
import CustomButton from '../../atoms/Button';
import Typography from '../../atoms/Typography';

import { Stack, Theme } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface StyledDropZoneProps {
    error: boolean;
    theme?: Theme;
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

    border-radius: 1.5rem;
    height: 11rem;
    width: 11rem;
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
    height: 100%;
    position: relative;

    button {
        position: absolute;
        bottom: 1.5rem;
        width: 90%;
    }  
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
            
            <StyledStack direction="column" >
                <Typography size="h5" weight='Light' color="#C4C4C4" align="center"> Drag and Drop an image here </Typography>    
                <CustomButton size="medium" onClick={getInputProps} label={props.fileUrl === '' ? 'Choose file' : 'Edit file' } />
            </StyledStack>
        </StyledZone>
    )
}