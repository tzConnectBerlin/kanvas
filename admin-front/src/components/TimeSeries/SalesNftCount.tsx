import { Line } from 'react-chartjs-2';
import useGetTimeSeriesData from './hooks/useGetTimeSeriesData';
import { theme } from 'theme';

export const SalesNftCount = () => {
  const { timeStamps, timeStampValues } = useGetTimeSeriesData('nftCount');

  const chartData = {
    labels: timeStamps,
    datasets: [
      {
        label: 'NFT Count',
        backgroundColor: `${theme.palette.primary.main}`,
        data: timeStampValues,
        borderColor: `${theme.palette.primary.main}40`,
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
    elements: {
      point: {
        pointStyle: 'circle',
      },
    },
  };

  return <Line data={chartData} options={chartOptions} />;
};
