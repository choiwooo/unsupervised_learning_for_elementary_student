const columns = [
  ["pencils", "연필 개수"],
  ["coloredPencils", "색연필 개수"],
  ["dolls", "인형 개수"],
  ["books", "책 개수"],
  ["reading", "독서(분)"],
  ["exercise", "운동(분)"],
  ["game", "게임(분)"],
  ["youtube", "영상시청(분)"],
  ["allowance", "주간용돈(천원)"],
  ["sleep", "수면(시간)"]
];

const sampleData = [
  [8,12,2,20,30,60,40,50,5,9.0],
  [5,24,8,35,50,30,20,30,10,9.5],
  [12,6,1,15,15,80,90,100,8,8.0],
  [6,18,6,45,60,20,15,25,12,9.5],
  [10,12,3,25,35,50,50,60,7,8.5],
  [4,36,10,50,70,15,10,20,15,10.0],
  [7,24,7,40,55,25,20,35,10,9.5],
  [15,6,0,10,10,90,100,110,6,8.0],
  [9,12,2,30,40,55,45,55,8,9.0],
  [5,18,8,38,45,30,25,40,12,9.5],
  [11,12,3,22,25,70,80,90,7,8.0],
  [6,24,9,42,65,20,15,25,14,9.5],
  [8,36,5,55,80,15,10,20,15,10.0],
  [14,6,1,12,15,85,95,105,5,8.5],
  [3,18,7,36,50,35,30,45,10,9.0],
  [9,12,4,28,30,50,55,65,9,8.5],
  [7,24,6,44,60,25,20,30,12,9.5],
  [13,6,0,18,20,75,85,95,6,8.0],
  [5,36,10,48,75,20,10,15,14,10.0],
  [10,12,2,24,35,60,60,70,8,8.5]
];

let chart;

function buildInputTable(data) {
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");

  thead.innerHTML =
    "<tr><th>학생</th>" +
    columns.map(([, label]) => `<th>${label}</th>`).join("") +
    "</tr>";

  tbody.innerHTML = data.map((row, i) => `
    <tr>
      <td>${i + 1}번</td>
      ${row.map((v, j) => `
        <td><input type="number" step="${j === 9 ? "0.1" : "1"}" value="${v}" data-row="${i}" data-col="${j}"></td>
      `).join("")}
    </tr>
  `).join("");
}

function readData() {
  const rows = Array.from({ length: 20 }, () => Array(columns.length).fill(0));
  document.querySelectorAll("#dataTable input").forEach(input => {
    rows[+input.dataset.row][+input.dataset.col] = Number(input.value);
  });
  return rows;
}

function standardize(data) {
  const n = data.length;
  const p = data[0].length;
  const means = Array(p).fill(0);
  const sds = Array(p).fill(0);

  for (let j = 0; j < p; j++) {
    means[j] = data.reduce((s, r) => s + r[j], 0) / n;
    const variance = data.reduce((s, r) => s + (r[j] - means[j]) ** 2, 0) / n;
    sds[j] = Math.sqrt(variance) || 1;
  }

  return data.map(r => r.map((v, j) => (v - means[j]) / sds[j]));
}

function dist2(a, b) {
  return a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
}

function kmeans(data, k, maxIter = 100) {
  // 서로 떨어진 점들을 순차적으로 초기 중심으로 선택
  const centers = [data[0].slice()];
  while (centers.length < k) {
    let bestIdx = 0, bestDist = -1;
    data.forEach((row, idx) => {
      const nearest = Math.min(...centers.map(c => dist2(row, c)));
      if (nearest > bestDist) {
        bestDist = nearest;
        bestIdx = idx;
      }
    });
    centers.push(data[bestIdx].slice());
  }

  let labels = Array(data.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    const nextLabels = data.map(row => {
      const ds = centers.map(c => dist2(row, c));
      return ds.indexOf(Math.min(...ds));
    });

    let changed = nextLabels.some((v, i) => v !== labels[i]);
    labels = nextLabels;

    const newCenters = Array.from({ length: k }, () => Array(data[0].length).fill(0));
    const counts = Array(k).fill(0);

    data.forEach((row, i) => {
      const c = labels[i];
      counts[c]++;
      row.forEach((v, j) => newCenters[c][j] += v);
    });

    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let j = 0; j < data[0].length; j++) newCenters[c][j] /= counts[c];
      centers[c] = newCenters[c];
    }

    if (!changed && iter > 0) break;
  }

  return { labels, centers };
}

function covarianceMatrix(data) {
  const n = data.length, p = data[0].length;
  const cov = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = i; j < p; j++) {
      let s = 0;
      for (const row of data) s += row[i] * row[j];
      const v = s / (n - 1);
      cov[i][j] = v;
      cov[j][i] = v;
    }
  }
  return cov;
}

function matVec(A, v) {
  return A.map(row => row.reduce((s, x, i) => s + x * v[i], 0));
}

function norm(v) {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function powerIteration(A, seedShift = 0, iterations = 120) {
  let v = Array.from({ length: A.length }, (_, i) => 1 + ((i + seedShift) % 3));
  for (let t = 0; t < iterations; t++) {
    let w = matVec(A, v);
    const n = norm(w) || 1;
    v = w.map(x => x / n);
  }
  const Av = matVec(A, v);
  const eigenvalue = v.reduce((s, x, i) => s + x * Av[i], 0);
  return { vector: v, value: eigenvalue };
}

function pca2(data) {
  const cov = covarianceMatrix(data);
  const e1 = powerIteration(cov, 0);

  const deflated = cov.map((row, i) =>
    row.map((x, j) => x - e1.value * e1.vector[i] * e1.vector[j])
  );
  const e2 = powerIteration(deflated, 1);

  return data.map(row => [
    row.reduce((s, x, i) => s + x * e1.vector[i], 0),
    row.reduce((s, x, i) => s + x * e2.vector[i], 0)
  ]);
}


function silhouetteScore(data, labels, k) {
  if (k <= 1 || k >= data.length) return -1;

  let total = 0;

  for (let i = 0; i < data.length; i++) {
    const own = labels[i];

    const same = [];
    for (let j = 0; j < data.length; j++) {
      if (i !== j && labels[j] === own) same.push(Math.sqrt(dist2(data[i], data[j])));
    }

    // singleton cluster의 silhouette은 0으로 처리
    if (same.length === 0) continue;

    const a = same.reduce((s, v) => s + v, 0) / same.length;

    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === own) continue;
      const other = [];
      for (let j = 0; j < data.length; j++) {
        if (labels[j] === c) other.push(Math.sqrt(dist2(data[i], data[j])));
      }
      if (other.length) {
        const meanDist = other.reduce((s, v) => s + v, 0) / other.length;
        if (meanDist < b) b = meanDist;
      }
    }

    const denom = Math.max(a, b);
    total += denom === 0 ? 0 : (b - a) / denom;
  }

  return total / data.length;
}

function chooseBestK(data, minK = 2, maxK = 6) {
  const candidates = [];
  const upper = Math.min(maxK, data.length - 1);

  for (let k = minK; k <= upper; k++) {
    const result = kmeans(data, k);
    const score = silhouetteScore(data, result.labels, k);
    candidates.push({ k, score, labels: result.labels });
  }

  candidates.sort((a, b) => b.score - a.score);
  return { best: candidates[0], all: candidates.slice().sort((a, b) => a.k - b.k) };
}

function clusterMeans(raw, labels, k) {
  return Array.from({ length: k }, (_, c) => {
    const rows = raw.filter((_, i) => labels[i] === c);
    return columns.map((_, j) =>
      rows.reduce((s, r) => s + r[j], 0) / rows.length
    );
  });
}

function renderResults(raw, labels, points, k, scores) {
  document.querySelector("#results").classList.remove("hidden");

  const counts = Array(k).fill(0);
  labels.forEach(x => counts[x]++);
  document.querySelector("#summaryBadges").innerHTML =
    `<span class="badge">최적 k = ${k}</span>` +
    counts.map((n, c) => `<span class="badge">군집 ${c + 1}: ${n}명</span>`).join("");

  document.querySelector("#silhouetteBox").innerHTML = scores.map(item => `
    <div class="silhouette-item ${item.k === k ? "best" : ""}">
      <strong>k = ${item.k}</strong>
      <span>Silhouette ${item.score.toFixed(3)}</span>
    </div>
  `).join("");

  document.querySelector("#resultTable tbody").innerHTML =
    labels.map((c, i) => `
      <tr>
        <td>${i + 1}번</td>
        <td><span class="cluster-pill">군집 ${c + 1}</span></td>
      </tr>
    `).join("");

  const means = clusterMeans(raw, labels, k);
  document.querySelector("#meanTable").innerHTML =
    "<thead><tr><th>군집</th>" +
    columns.map(([, label]) => `<th>${label}</th>`).join("") +
    "</tr></thead><tbody>" +
    means.map((row, c) => `
      <tr>
        <td>군집 ${c + 1}</td>
        ${row.map(v => `<td>${v.toFixed(1)}</td>`).join("")}
      </tr>
    `).join("") +
    "</tbody>";

  const palette = ["#375dfb", "#12b76a", "#f79009", "#7a5af8", "#f04438"];
  const datasets = Array.from({ length: k }, (_, c) => ({
    label: `군집 ${c + 1}`,
    data: points
      .map((p, i) => ({ x: p[0], y: p[1], student: `${i + 1}번`, cluster: labels[i] }))
      .filter(p => p.cluster === c),
    backgroundColor: palette[c],
    pointRadius: 7,
    pointHoverRadius: 9
  }));

  if (chart) chart.destroy();

  chart = new Chart(document.querySelector("#clusterChart"), {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.student} · ${ctx.dataset.label}`
          }
        }
      },
      scales: {
        x: { title: { display: true, text: "PCA 1축" } },
        y: { title: { display: true, text: "PCA 2축" } }
      }
    }
  });

  document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function runAnalysis() {
  const raw = readData();

  const invalid = raw.some(row => row.some(v => !Number.isFinite(v)));
  if (invalid) {
    alert("모든 칸에 숫자를 입력해주세요.");
    return;
  }

  const X = standardize(raw);
  const selection = chooseBestK(X, 2, 6);
  const k = selection.best.k;
  const labels = selection.best.labels;
  const points = pca2(X);

  renderResults(raw, labels, points, k, selection.all);
}

document.querySelector("#runBtn").addEventListener("click", runAnalysis);
document.querySelector("#resetBtn").addEventListener("click", () => {
  buildInputTable(sampleData);
  document.querySelector("#results").classList.add("hidden");
});

buildInputTable(sampleData);
