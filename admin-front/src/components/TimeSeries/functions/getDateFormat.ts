import { Month, Resolution, ResolutionValues } from '../utility';

interface GetDateFormatParams {
  resolution: Resolution;
  month: Month;
}

export const getDateFormat = ({
  resolution,
  month,
}: GetDateFormatParams): string => {
  const individualMonthIsSelected = month !== 'All';

  switch (resolution) {
    case ResolutionValues.HOUR:
      return 'DD/MM hh:mm a';
    case ResolutionValues.DAY:
      return individualMonthIsSelected ? 'DD' : 'DD/MM';
    case ResolutionValues.MONTH:
      return 'MMMM';
    default:
      return 'DD/MM';
  }
};
