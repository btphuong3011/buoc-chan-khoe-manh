"use strict";

(() => {
  const { footFields, examples, newCase, assess } = window.FootScreening;
  const byId = (id) => document.getElementById(id);
  const panels = [...document.querySelectorAll("[data-panel]")];
  const steps = [...document.querySelectorAll("[data-step]")];
  const pointTitles = ["Ngón cái", "Đầu xương bàn 1", "Đầu xương bàn 5"];
  const sides = ["Bàn chân trái", "Bàn chân phải"];
  const pointText = { unknown: "Chưa ghi", felt: "Cảm nhận", missed: "Không cảm nhận" };
  const fieldText = { unknown: "Chưa rõ", no: "Không", yes: "Có" };
  const activeText = { unknown: "Chưa rõ", none: "Không ghi nhận", active: "Có tổn thương", urgent: "Nghi tình trạng nặng" };
  const hints = {
    loss: "Ghi theo kết luận chuyên môn trong ca mẫu.",
    pad: "Ghi theo đánh giá chuyên môn trong ca mẫu.",
    deformity: "Ghi theo nhận định về hình dạng bàn chân.",
    history: "Chọn Có nếu có ít nhất một trong các yếu tố này.",
  };
  let data = newCase();
  let selectedPoint = 0;
  let selectedExample = "";
  let edited = false;
  let step = 0;

  const pointLabel = (index) => `${sides[Math.floor(index / 3)]} · ${pointTitles[index % 3]}`;
  const signal = (text) => { byId("announcement").textContent = text; };

  function showStep(next, focus = true) {
    step = next;
    panels.forEach((panel, index) => { panel.hidden = index !== step; });
    for (const [index, button] of steps.entries()) {
      if (index === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    }
    if (focus) panels[step].querySelector("h2").focus();
  }

  // The background is illustrative. The positioned HTML buttons are keyboard-accessible.
  const sole = '<svg viewBox="0 0 150 230" aria-hidden="true" focusable="false"><path d="M34 16C44 7 57 11 62 23L66 34C72 25 86 26 92 36L95 46C102 40 113 44 117 53L119 61C128 58 136 65 136 75C142 91 134 113 124 133C114 151 114 168 115 187C116 212 103 225 82 225C57 225 46 208 47 186C48 162 44 146 35 130C25 111 13 89 19 63C22 51 23 42 22 33C22 25 27 20 34 16Z"/><path class="sole-inner" d="M37 68C33 90 46 113 55 136C63 156 64 176 61 190M118 79C117 106 100 125 96 150C92 171 102 194 94 205"/></svg>';
  const locations = [[29, 16], [32, 41], [73, 43]];
  byId("footboard").innerHTML = sides.map((side, sideIndex) => `<section class="foot-card" aria-label="${side}">
    <h3>${side}</h3>
    <div class="sole ${sideIndex ? "mirror" : ""}">
      ${sole}
      ${locations.map(([x, y], index) => `<button class="point" type="button" style="--point-x:${sideIndex ? 100 - x : x}%;--point-y:${y}%" data-point="${sideIndex * 3 + index}">${index + 1}</button>`).join("")}
    </div>
    <p><span>1</span> Ngón cái <span>2</span> Đầu xương bàn 1 <span>3</span> Đầu xương bàn 5</p>
  </section>`).join("");

  byId("example-list").innerHTML = Object.entries(examples).map(([key, item]) => `<button class="example ${key}" type="button" data-example="${key}" aria-pressed="false">
    <span class="example-mark" aria-hidden="true"></span><span><strong>${item.title}</strong><small>${item.detail}</small></span>
  </button>`).join("");

  byId("risk-fields").innerHTML = Object.entries(footFields).filter(([key]) => key !== "active").map(([key, name]) => `<fieldset class="clinical-row">
    <legend>${name}</legend><p>${hints[key]}</p>
    <div class="segmented" role="group" aria-label="${name}">${Object.entries(fieldText).map(([value, label]) => `<button type="button" data-field="${key}" data-value="${value}">${label}</button>`).join("")}</div>
  </fieldset>`).join("");

  const pointButtons = [...document.querySelectorAll("[data-point]")];
  const pointOptions = [...document.querySelectorAll("[data-point-value]")];
  const fieldButtons = [...document.querySelectorAll("[data-field]")];
  const exampleButtons = [...document.querySelectorAll("[data-example]")];

  function outcomeMarkup(result) {
    const label = result.kind === "risk" ? "THAM CHIẾU IWGDF 2023" : "BƯỚC TIẾP THEO";
    const reason = result.reason || `Còn ${result.missing.length} mục chuyên môn cần xác nhận.`;
    return `<small class="overline">${label}</small><strong>${result.title}</strong><p>${reason}</p>
      ${result.interval ? `<p class="interval">Tái sàng lọc tham chiếu · ${result.interval.toLowerCase()}</p>` : ""}`;
  }

  function render() {
    const result = assess(data);
    const tone = result.kind === "risk" ? `risk-${result.level}` : result.kind;
    const recorded = data.points.filter((value) => value !== "unknown").length;
    for (const id of ["map-count", "side-count"]) byId(id).textContent = `${recorded}/6 điểm đã ghi`;
    byId("case-label").textContent = selectedExample
      ? `Ca mẫu · ${examples[selectedExample].title}${edited ? " · Đã sửa" : ""}`
      : "Ca mới";
    byId("point-name").textContent = pointLabel(selectedPoint);
    byId("mini-progress").innerHTML = data.points.map((value) => `<span class="${value}"></span>`).join("");

    for (const [index, button] of pointButtons.entries()) {
      button.dataset.state = data.points[index];
      button.setAttribute("aria-pressed", String(index === selectedPoint));
      button.setAttribute("aria-label", `${pointLabel(index)} · ${pointText[data.points[index]]}`);
    }
    for (const button of pointOptions) {
      button.setAttribute("aria-pressed", String(data.points[selectedPoint] === button.dataset.pointValue));
    }
    for (const button of fieldButtons) {
      button.setAttribute("aria-pressed", String(data[button.dataset.field] === button.dataset.value));
    }
    for (const button of exampleButtons) {
      button.setAttribute("aria-pressed", String(selectedExample === button.dataset.example));
    }
    const markup = outcomeMarkup(result);
    byId("outcome").className = `outcome ${tone}`;
    byId("outcome").innerHTML = markup;
    byId("receipt-outcome").className = `receipt-outcome ${tone}`;
    byId("receipt-outcome").innerHTML = markup;
    byId("receipt-points").innerHTML = data.points.map((value, index) => `<li>${pointLabel(index)}<strong>${pointText[value]}</strong></li>`).join("");
    byId("receipt-factors").innerHTML = Object.entries(footFields).map(([key, label]) =>
      `<li>${label}<strong>${(key === "active" ? activeText : fieldText)[data[key]]}</strong></li>`).join("");

    const printReady = result.kind !== "pending";
    byId("print-sheet").disabled = !printReady;
    document.body.toggleAttribute("data-print-ready", printReady);
    byId("review-link").textContent =
      ["urgent", "active"].includes(result.kind) ? "Xem phiếu bàn giao" : "Ghi nhận tổn thương";
    byId("review-link").dataset.go = ["urgent", "active"].includes(result.kind) ? "2" : "1";
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const { point, pointValue, field, value, go, step: nav, example } = button.dataset;
    if (go !== undefined || nav !== undefined) {
      showStep(Number(go ?? nav));
      return;
    }
    if (point !== undefined) {
      selectedPoint = Number(point);
    } else if (pointValue) {
      data.points[selectedPoint] = pointValue;
      edited = true;
      const next = data.points.findIndex((entry, index) => entry === "unknown" && index > selectedPoint);
      if (pointValue !== "unknown" && next !== -1) selectedPoint = next;
    } else if (field) {
      data[field] = value;
      edited = true;
    } else if (example) {
      data = examples[example].build();
      selectedPoint = 0;
      selectedExample = example;
      edited = false;
      showStep(example === "lesion" ? 1 : 0);
      signal(`Đã mở ca mẫu ${examples[example].title}.`);
    } else if (button.id === "reset") {
      data = newCase();
      selectedPoint = 0;
      selectedExample = "";
      edited = false;
      showStep(0);
      signal("Đã mở ca mới.");
    } else if (button.id === "print-sheet" && assess(data).kind !== "pending") {
      window.print();
      return;
    }
    render();
  });

  showStep(0, false);
  render();
})();
