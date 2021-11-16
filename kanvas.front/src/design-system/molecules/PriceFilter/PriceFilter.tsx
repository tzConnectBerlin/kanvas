import styled from '@emotion/styled';

import { FC, Children } from 'react';

interface PriceFilterProps {

}


export const PriceFilter : FC<PriceFilterProps> = ({children, ...props}) => {

    return (
        <StyledUl openFilters={props.openFilters}>
            {Children.map(children, child => (
                <StyledLi openFilters={props.openFilters}>
                    {child}
                </StyledLi>
            ))}
        </StyledUl>
    )
}
