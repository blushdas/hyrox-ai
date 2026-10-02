export function timeToSeconds(value: string): number | null {
 if (value === "") return null;
 if (!/^\d+:\d{2}(?::\d{2})?$/.test(value)) throw new Error("Invalid race time");
 const parts = value.split(":").map(Number);
 if (parts.slice(1).some(n => n > 59)) throw new Error("Invalid race time");
 const seconds = parts.reduce((n, part) => n * 60 + part, 0);
 if (!Number.isSafeInteger(seconds)) throw new Error("Invalid race time");
 return seconds;
}
export function secondsToTime(value: number | null): string {
 if (value === null) return "";
 if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid seconds");
 const s = String(value % 60).padStart(2, "0");
 return value < 3600 ? Math.floor(value / 60) + ":" + s : Math.floor(value / 3600) + ":" + String(Math.floor(value / 60) % 60).padStart(2, "0") + ":" + s;
}
export function weightToKg(value: number | null, unit: "kg" | "lbs"): number | null {
 if (value === null) return null;
 if (!Number.isFinite(value) || value <= 0) throw new Error("Invalid weight");
 return unit === "lbs" ? value * 0.45359237 : value;
}
export function kgToWeight(value: number | null, unit: "kg" | "lbs"): number | null {
 if (value === null) return null;
 return Math.round((unit === "lbs" ? value / 0.45359237 : value) * 10) / 10;
}
export function epochToIso(value: number): string { return new Date(value).toISOString(); }
