import { Month, Resolution, ResolutionValues } from '../utility';

interface GetDateFormatParams {
  resolution: Resolution;
  month: Month;
}

export const getDateFormat = ({
  resolution,
  month,
}: GetDateFormatParams): string => {
  let format = 'DD/MM';
  const individualMonthIsSelected = month !== 'All';

  if (resolution === ResolutionValues.HOUR) {
    format = 'DD/MM HH:MM';
  }

  if (resolution === ResolutionValues.DAY && individualMonthIsSelected) {
    format = 'DD';
  }

  if (resolution === ResolutionValues.MONTH) {
    format = 'MMMM';
  }

  return format;
};
