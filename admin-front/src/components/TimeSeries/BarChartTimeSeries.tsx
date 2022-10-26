import { theme } from 'theme';
import { Bar } from 'react-chartjs-2';
import { TimeSeriesType } from './utility';
import { useEffect, useState } from 'react';

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
  const [useCustomThickness, setUseCustomThickness] = useState<boolean>(false);
  const isPriceVolume = timeSeriesType === 'priceVolume';

  useEffect(() => {
    if (timeStamps.length > 200 && !useCustomThickness) {
      setUseCustomThickness(true);
    } else if (timeStamps.length <= 200 && useCustomThickness) {
      setUseCustomThickness(false);
    }
  }, [timeStamps]);

  const chartData = {
    labels: timeStamps,
    datasets: [
      {
        label: isPriceVolume ? 'Price Volume' : 'NFT Count',
        backgroundColor: `${theme.palette.primary.main}80`,
        borderColor: `${theme.palette.primary.main}`,
        borderWidth: 0.5,
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
    barThickness: useCustomThickness ? 2 : undefined,
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
          text: isPriceVolume
            ? currencySymbol
              ? `Price in ${currencySymbol}`
              : 'Price'
            : 'Count',
        },
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};

export default BarChartTimeSeries;
