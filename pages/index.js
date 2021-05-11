// @ts-check

import Head from "next/head";

import data from "../data/data.json";
import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js";

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes"
        />
        <title>Benchmarks</title>
      </Head>
      <header>
        <div className="header-item">
          <strong className="header-label">Last Update:</strong>
          <span>{new Date(data.lastUpdate).toString()}</span>
        </div>
        <div className="header-item">
          <strong className="header-label">Repository:</strong>
          <a rel="noopener" href={data.repoUrl}>
            {data.repoUrl}
          </a>
        </div>
      </header>

      <AllCharts dataSets={init()} />

      <footer>
        <button onClick={download}>Download data as JSON</button>
        <div className="spacer"></div>
        <div className="small">
          Powered by{" "}
          <a
            rel="noopener"
            href="https://github.com/marketplace/actions/continuous-benchmark"
          >
            github-action-benchmark
          </a>
        </div>
      </footer>
    </>
  );
}

// Colors from https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
const toolColors = {
  cargo: "#dea584",
  go: "#00add8",
  benchmarkjs: "#f1e05a",
  pytest: "#3572a5",
  googlecpp: "#f34b7d",
  catch2: "#f34b7d",
  _: "#333333",
};

function collectBenchesPerTestCase(entries) {
  const map = new Map();
  for (const entry of entries) {
    const { commit, date, tool, benches } = entry;
    for (const bench of benches) {
      const result = { commit, date, tool, bench };
      const arr = map.get(bench.name);
      if (arr === undefined) {
        map.set(bench.name, [result]);
      } else {
        arr.push(result);
      }
    }
  }
  return map;
}

function init() {
  // Prepare data points for charts
  return Object.keys(data.entries).map((name) => ({
    name,
    dataSet: collectBenchesPerTestCase(data.entries[name]),
  }));
}

function Graph({ name, dataset }) {
  const ref = useRef();
  useEffect(() => {
    const color = toolColors[dataset.length > 0 ? dataset[0].tool : "_"];
    const data = {
      labels: dataset.map((d) => d.commit.id.slice(0, 7)),
      datasets: [
        {
          label: name,
          data: dataset.map((d) => d.bench.value),
          borderColor: color,
          backgroundColor: color + "60", // Add alpha for #rrggbbaa
        },
      ],
    };
    const options = {
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "commit",
            },
          },
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: dataset.length > 0 ? dataset[0].bench.unit : "",
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
      tooltips: {
        callbacks: {
          afterTitle: (items) => {
            const { index } = items[0];
            const data = dataset[index];
            return (
              "\n" +
              data.commit.message +
              "\n\n" +
              data.commit.timestamp +
              " committed by @" +
              data.commit.committer.username +
              "\n"
            );
          },
          label: (item) => {
            let label = item.value;
            const { range, unit } = dataset[item.index].bench;
            label += " " + unit;
            if (range) {
              label += " (" + range + ")";
            }
            return label;
          },
          afterLabel: (item) => {
            const { extra } = dataset[item.index].bench;
            return extra ? "\n" + extra : "";
          },
        },
      },
      onClick: (_mouseEvent, activeElems) => {
        if (activeElems.length === 0) {
          return;
        }
        // XXX: Undocumented. How can we know the index?
        const index = activeElems[0]._index;
        const url = dataset[index].commit.url;
        window.open(url, "_blank");
      },
    };

    new Chart(ref.current, {
      type: "line",
      data,
      options,
    });
  }, [ref]);

  return <canvas className="benchmark-chart" ref={ref} />;
}

function BenchSet({ name, benchSet }) {
  return (
    <div className="benchmark-set">
      <h1 className="benchmark-title">{name}</h1>
      <div className="benchmark-graphs">
        {[...benchSet.entries()].map(([name, benches]) => (
          <Graph name={name} dataset={benches} key={name} />
        ))}
      </div>
    </div>
  );
}

function AllCharts({ dataSets }) {
  return (
    <main>
      {dataSets.map(({ name, dataSet }) => (
        <BenchSet name={name} benchSet={dataSet} key={name} />
      ))}
    </main>
  );
}

function download() {
  const dataUrl = "data:," + JSON.stringify(data, null, 2);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "benchmark_data.json";
  a.click();
}
