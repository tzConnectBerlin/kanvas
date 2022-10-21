import { theme } from 'theme';
import { Bar } from 'react-chartjs-2';
import { TimeSeriesType } from './utility';

interface BarChartTimeSeriesProps {
  timeSeriesType: TimeSeriesType;
  timeStamps: string[];
  timeStampValues: number[];
  currencySymbol?: string;
}

const BarChartTimeSeries = ({
  timeSeriesType,
  timeStamps,
  timeStampValues,
  currencySymbol,
}: BarChartTimeSeriesProps) => {
  const isPriceVolume = timeSeriesType === 'priceVolume' && !!currencySymbol;

  const chartData = {
    labels: timeStamps,
    datasets: [
      {
        label: isPriceVolume ? 'Price Volume' : 'NFT Count',
        backgroundColor: `${theme.palette.primary.main}80`,
        borderColor: `${theme.palette.primary.main}`,
        borderWidth: 1,
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
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: isPriceVolume ? `Price in ${currencySymbol}` : 'Count',
        },
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};

export default BarChartTimeSeries;
