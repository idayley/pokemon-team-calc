import { VictoryBar, VictoryChart, VictoryTheme, VictoryTooltip } from 'victory';

const StatsChart = ({ pokemon }) => {
  const statsData = pokemon.stats.map((stat, index) => ({
    stat: ['HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'][index],
    value: stat.base_stat
  }));

  return (
    <div className="overflow-x-auto">
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={20}
        height={300}
        width={600}
        padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
      >
        <VictoryBar
          data={statsData}
          x="stat"
          y="value"
          labels={({ datum }) => `${datum.value}`}
          labelComponent={<VictoryTooltip />}
          style={{
            data: { fill: "#4F46E5", width: 30 },
            labels: { fontSize: 12 }
          }}
        />
      </VictoryChart>
    </div>
  );
};

export default StatsChart;
