interface IBackground {
    color: string;
}

interface ILogo {
    filter: string;
}

interface IColor {
    primary: string;
}

interface ITypography {
    color: IColor;
}

export interface ITheme {
    background: IBackground;
    logo: ILogo;
    typography: ITypography;
}
