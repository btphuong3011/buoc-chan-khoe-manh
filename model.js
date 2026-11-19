"use strict";

const footFields = {
  active: "Tổn thương đang có",
  loss: "Mất cảm giác bảo vệ (LOPS)",
  pad: "Bệnh động mạch ngoại biên (PAD)",
  deformity: "Biến dạng bàn chân",
  history: "Tiền sử loét, đoạn chi hoặc bệnh thận giai đoạn cuối",
};

const strata = [
  { title: "Mức 0 · Rất thấp", interval: "Mỗi năm", reason: "Chưa ghi nhận mất cảm giác bảo vệ hoặc bệnh động mạch ngoại biên." },
  { title: "Mức 1 · Thấp", interval: "Mỗi 6–12 tháng", reason: "Có một trong hai yếu tố mất cảm giác bảo vệ hoặc bệnh động mạch ngoại biên." },
  { title: "Mức 2 · Trung bình", interval: "Mỗi 3–6 tháng", reason: "Có phối hợp từ hai yếu tố gồm mất cảm giác bảo vệ, bệnh động mạch ngoại biên và biến dạng chân." },
  { title: "Mức 3 · Cao", interval: "Mỗi 1–3 tháng", reason: "Có mất cảm giác bảo vệ hoặc bệnh động mạch ngoại biên, kèm tiền sử hoặc bệnh thận giai đoạn cuối." },
];

function newCase() {
  return {
    active: "unknown", loss: "unknown", pad: "unknown", deformity: "unknown", history: "unknown",
    points: Array(6).fill("unknown"),
  };
}

const examples = {
  routine: {
    title: "Khám định kỳ", detail: "Đủ dữ kiện · Mức 0",
    build: () => ({
      active: "none", loss: "no", pad: "no", deformity: "no", history: "no",
      points: Array(6).fill("felt"),
    }),
  },
  risk: {
    title: "Tiền sử loét", detail: "Có PAD · Mức 3",
    build: () => ({
      active: "none", loss: "no", pad: "yes", deformity: "no", history: "yes",
      points: Array(6).fill("felt"),
    }),
  },
  lesion: {
    title: "Có vết loét mới", detail: "Ưu tiên chuyển đánh giá",
    build: () => ({ ...newCase(), active: "active" }),
  },
};

function assess(data) {
  if (data.active === "urgent") {
    return {
      kind: "urgent", title: "Chuyển đánh giá khẩn",
      reason: "Báo ngay nhân viên y tế phụ trách và kích hoạt quy trình chuyển cấp cứu tại cơ sở.",
    };
  }
  if (data.active === "active") {
    return {
      kind: "active", title: "Cần được khám sớm",
      reason: "Báo nhân viên y tế để sắp xếp đánh giá sớm theo quy trình địa phương.",
    };
  }
  const known = (key) => key === "active" ? data[key] === "none" : ["yes", "no"].includes(data[key]);
  const missing = Object.keys(footFields).filter((key) => !known(key));
  if (missing.length) return { kind: "pending", title: "Chưa đủ dữ kiện", missing };

  const loss = data.loss === "yes";
  const pad = data.pad === "yes";
  const deformity = data.deformity === "yes";
  const history = data.history === "yes";

  if (history && !loss && !pad) {
    return {
      kind: "pending", title: "Cần đối chiếu tiền sử",
      reason: "Có tiền sử quan trọng. Nhân viên y tế cần rà lại dữ kiện trước khi chốt mức nguy cơ.",
    };
  }

  let level = 0;
  if (loss || pad) {
    if (history) level = 3;
    else if ((loss && pad) || deformity) level = 2;
    else level = 1;
  }
  return { kind: "risk", level, ...strata[level] };
}

const model = { footFields, examples, newCase, assess };
if (typeof module !== "undefined") module.exports = model;
else window.FootScreening = model;
