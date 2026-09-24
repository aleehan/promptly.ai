// components/MatrixLoader/MatrixLoader.jsx

const CORNERS = [0, 3, 12, 15];
const RING = [1, 2, 7, 11, 14, 13, 8, 4];
const INNER = [5, 6, 9, 10];
const TWINKLE = [7, 2, 11, 5, 14, 9, 0, 12, 3, 15, 6, 10, 13, 1, 8, 4];

function delayFor(variant, idx, cycle) {
    const col = idx % 4;
    if (variant === "scan") return Math.round(col * (cycle / 10));
    if (variant === "twinkle") return Math.round(TWINKLE[idx] * (cycle / 16));
    if (variant === "orbit") {
        const k = RING.indexOf(idx);
        return k === -1 ? null : Math.round(k * (cycle / 8));
    }
    if (variant === "pulse") return Math.round((INNER.includes(idx) ? 0 : 1) * (cycle * 0.16));
    return 0;
}

const MatrixLoader = ({ variant = "scan", rounded = false, cycle = 1200, label = "Loading" }) => {
    return (
        <div className="t-matrix" data-variant={variant} role="status" aria-label={label}>
            {Array.from({ length: 16 }, (_, idx) => {
                if (rounded && CORNERS.includes(idx)) return <i key={idx} className="is-gap" />;
                const d = delayFor(variant, idx, cycle);
                return <i key={idx} style={d === null ? { animation: "none" } : { "--d": d }} />;
            })}
        </div>
    );
};

export default MatrixLoader;