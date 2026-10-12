// Grading for per-subject marks (0-100). One scale for marks entry, reports and student
// views, set by the super admin (pages/admin/ManageGrading) and loaded from the server.
import { useEffect, useState } from "react";
import { getGradingScale } from "../api/grading";

const SCALE_CHANGED = "nsms:grading-scale-changed";

// Badge tones (see components/GradeBadge): passing bands from the top get these in
// order, any further passing bands are slate, and failing bands are red.
const PASS_TONES = ["green", "blue", "purple", "amber"];

// Adds a tone to each band of a scale from the API ({ bands, pass_mark }, highest first)
export function withTones(scale) {
  let passIndex = 0;
  const bands = scale.bands.map((band) => ({
    ...band,
    tone: band.is_pass ? PASS_TONES[passIndex++] || "slate" : "red",
  }));
  return { ...scale, bands, passMark: scale.pass_mark };
}

let current = null; // the loaded scale
let loading = null; // the request loading it, shared by every caller

function loadGradingScale() {
  loading ??= getGradingScale().then(
    (scale) => (current = withTones(scale)),
    (error) => {
      loading = null; // let the next caller try again
      throw error;
    }
  );
  return loading;
}

// Call after saving the scale, so every screen switches to the new one
export function setGradingScale(scale) {
  current = withTones(scale);
  loading = Promise.resolve(current);
  window.dispatchEvent(new Event(SCALE_CHANGED));
}

// The grading scale, or null until it has loaded (or if it cannot be loaded)
export function useGradingScale() {
  const [scale, setScale] = useState(current);
  useEffect(() => {
    let mounted = true;
    loadGradingScale().then(
      (loaded) => mounted && setScale(loaded),
      () => {} // grades show as a dash; the page reports its own errors
    );
    const onChange = () => setScale(current);
    window.addEventListener(SCALE_CHANGED, onChange);
    return () => {
      mounted = false;
      window.removeEventListener(SCALE_CHANGED, onChange);
    };
  }, []);
  return scale;
}

// { grade, tone } for a mark, or a dash when there is no mark or no scale yet
export function gradeFor(mark, scale) {
  if (mark == null || Number.isNaN(mark) || !scale) return { grade: "-", tone: "slate" };
  return scale.bands.find((band) => mark >= band.min_mark) || { grade: "-", tone: "slate" };
}

export const isPass = (mark, scale) => Boolean(scale) && mark >= scale.passMark;

// Percentage of the marks that pass; null when there are none or no scale yet
export function passRate(marks, scale) {
  if (!scale || !marks.length) return null;
  return (marks.filter((mark) => isPass(mark, scale)).length / marks.length) * 100;
}

// Mean of the numbers given, ignoring missing values; null when there are none
export function average(values) {
  const present = values.filter((v) => v != null && !Number.isNaN(v));
  return present.length ? present.reduce((sum, v) => sum + v, 0) / present.length : null;
}

export const formatMark = (value) => (value == null ? "-" : Number.isInteger(value) ? String(value) : value.toFixed(1));
