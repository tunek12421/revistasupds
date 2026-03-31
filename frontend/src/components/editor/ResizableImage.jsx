import React, { useRef, useEffect } from "react";

export function ResizableImage({ src, width, height, onResize }) {
  const containerRef = useRef(null);
  const dragging = useRef(null);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const handle = dragging.current;
      let newW = startPos.current.w;
      let newH = startPos.current.h;
      const ratio = startPos.current.w / startPos.current.h;

      if (handle === "e") newW = Math.max(40, startPos.current.w + dx);
      else if (handle === "s") newH = Math.max(30, startPos.current.h + dy);
      else if (handle === "se") {
        newW = Math.max(40, startPos.current.w + dx);
        newH = newW / ratio;
      } else if (handle === "w") newW = Math.max(40, startPos.current.w - dx);
      else if (handle === "sw") {
        newW = Math.max(40, startPos.current.w - dx);
        newH = newW / ratio;
      } else if (handle === "ne") {
        newW = Math.max(40, startPos.current.w + dx);
        newH = newW / ratio;
      } else if (handle === "nw") {
        newW = Math.max(40, startPos.current.w - dx);
        newH = newW / ratio;
      } else if (handle === "n") newH = Math.max(30, startPos.current.h - dy);

      onResize(Math.round(newW), Math.round(newH));
    };

    const handleUp = () => {
      dragging.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [onResize]);

  const startDrag = (handle, e) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = handle;
    const img = containerRef.current;
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      w: img.offsetWidth,
      h: img.offsetHeight,
    };
    document.body.style.cursor =
      handle === "e" || handle === "w" ? "ew-resize" :
      handle === "n" || handle === "s" ? "ns-resize" :
      handle === "se" || handle === "nw" ? "nwse-resize" : "nesw-resize";
    document.body.style.userSelect = "none";
  };

  const handleStyle = (pos) => {
    const base = "absolute w-2.5 h-2.5 bg-white border-2 border-[#223b87] rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity";
    const positions = {
      nw: "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
      n: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
      ne: "top-0 right-0 translate-x-1/2 -translate-y-1/2",
      e: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
      se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
      s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
      sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
      w: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
    };
    return `${base} ${positions[pos]}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block group"
      style={{ width: width || "auto", height: height || "auto" }}
    >
      <img
        src={src}
        alt=""
        className="block rounded"
        style={{ width: "100%", height: "100%", objectFit: "fill" }}
        draggable={false}
      />
      {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((pos) => (
        <div
          key={pos}
          className={handleStyle(pos)}
          style={{ cursor: pos === "e" || pos === "w" ? "ew-resize" : pos === "n" || pos === "s" ? "ns-resize" : pos === "se" || pos === "nw" ? "nwse-resize" : "nesw-resize" }}
          onMouseDown={(e) => startDrag(pos, e)}
        />
      ))}
    </div>
  );
}
