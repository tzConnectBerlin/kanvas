import styled from '@emotion/styled';
import { FC } from 'react';

export interface FlexSpacerProps {
    borderBottom?: boolean;
    minHeight?: number;
    minWidth?: number;
    isdisplay?: any;
}

const FlexSpacerStyled = styled.div<FlexSpacerProps>`
    flex-grow: 1;

    border-bottom: ${(props) =>
        props.borderBottom ? '1px solid #d4d4d4' : ''};
    min-height: ${(props) => props.minHeight ?? 0}rem;
    min-width: ${(props) => props.minWidth ?? 0}rem;
    display: ${(props) => (props.isdisplay ? 'flex' : 'none')};

    transition: all 0.2s;

    @media (max-width: 1100px) {
        min-height: ${(props) =>
            props.minHeight ? props.minHeight * 0.8 : 0}rem;
        min-width: ${(props) => (props.minWidth ? props.minWidth * 0.8 : 0)}rem;
    }
`;

export const FlexSpacer: FC<FlexSpacerProps> = ({
    isdisplay = true,
    ...props
}) => {
    return (
        <FlexSpacerStyled
            borderBottom={props.borderBottom}
            minHeight={props.minHeight}
            minWidth={props.minWidth}
            isdisplay={isdisplay}
        />
    );
};
