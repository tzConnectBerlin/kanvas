import { Bar } from 'react-chartjs-2';
import useGetTimeSeriesData from './hooks/useGetTimeSeriesData';
import { theme } from 'theme';

export const SalesPriceVolume = () => {
  const { timeStamps, timeStampValues } = useGetTimeSeriesData('priceVolume');

  const chartData = {
    labels: timeStamps,
    datasets: [
      {
        label: 'Price Volume',
        backgroundColor: `${theme.palette.primary.main}`,
        data: timeStampValues,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};
