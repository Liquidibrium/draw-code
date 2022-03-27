import { getStroke } from "https://esm.sh/perfect-freehand@1";
import * as Y from "https://esm.sh/yjs@13";
import { WebrtcProvider } from "https://esm.sh/y-webrtc@10";

const ydoc = new Y.Doc();
const provider = new WebrtcProvider("awesome drawing",
    
    ydoc, {
    signaling: ["wss://yjs-webrtc-test.herokuapp.com"],
    password: "test",
});

const svg = document.querySelector("svg");

const oneOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

const colors = [
  { color: "#30bced", light: "#30bced33" },
  { color: "#6eeb83", light: "#6eeb8333" },
  { color: "#ffbc42", light: "#ffbc4233" },
  { color: "#ecd444", light: "#ecd44433" },
  { color: "#ee6352", light: "#ee635233" },
  { color: "#9ac2c9", light: "#9ac2c933" },
  { color: "#8acb88", light: "#8acb8833" },
  { color: "#1be7ff", light: "#1be7ff33" },
];

const names = ["Alice", "Bob", "Stephen", "Francois"];

const awareness = provider.awareness;

awareness.setLocalStateField("user", {
  name: oneOf(names),
  color: oneOf(colors).color,
});

awareness.on("change", (event) => {
  console.log("on Change", event);
  svg.querySelectorAll("circle").forEach((circle) => circle.remove());
  console.log("awareness.client Id ", awareness.clientID);
  awareness.getStates().forEach((state, clientID) => {
    console.log("state "+ state);
    console.log("clientID " + clientID);

    if (clientID === awareness.clientID) {
      return;
    }
    const pos = state.pos;
    if (!pos) {
      return;
    }
    const svgCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    //   <circle cx="50" cy="50" r="50"/>
    svgCircle.setAttribute("cx", pos.x);
    svgCircle.setAttribute("cy", pos.y);
    svgCircle.setAttribute("r", "10");
    svgCircle.setAttribute("fill", state.user.color);
    svg.appendChild(svgCircle);
  });
});

const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) {
    return "";
  }
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};

const ystrokes = ydoc.getArray("strokes");


const strokeStyle = {
  size: 12,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: {
    taper: 0,
    easing: (t) => t,
    cap: true,
  },
  end: {
    taper: 100,
    easing: (t) => t,
    cap: true,
  },
};

const getSvgStrokeFromYStroke = (ystroke) => {
  return getSvgPathFromStroke(
    getStroke(ystroke.get("path").toArray()),
    strokeStyle
  );
};

ystrokes.observe((event) => {
  console.log("ystrokes observe", event);
  event.changes.added.forEach((item) => {
    item.content.getContent().forEach((ystroke) => {
      const svgPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      svgPath.setAttribute("d", getSvgStrokeFromYStroke(ystroke));
      svgPath.setAttribute("fill", ystroke.get("color"));
      svg.appendChild(svgPath);
      ystroke.get("path").observe((event) => {
        console.log("ystroke path observe", event);
        svgPath.setAttribute("d", getSvgStrokeFromYStroke(ystroke));
      });
      ystroke.observe((event) => {
        console.log("ystroke observe", event);
        if (event.keysChanged.has("color")) {
          svgPath.setAttribute("fill", ystroke.get("color"));
        }
      });
    });
  });
});

/**
 * @type {Y.Map<> | null}
 */
let currentStroke = null;
svg.addEventListener("pointerdown", (event) => {
  console.log("pointerdown", event);
  currentStroke = new Y.Map();
  currentStroke.set("color", oneOf(colors).color);
  const currentPath = new Y.Array();
  currentPath.push([[event.x, event.y, event.pressure]]);
  currentStroke.set("path", currentPath);
  ystrokes.push([currentStroke]);
});

svg.addEventListener("pointermove", (event) => {
  console.log("pointermove", event);
  awareness.setLocalStateField("pos", { x: event.x, y: event.y });
  if (event.buttons !== 1) {
    currentStroke = null;
    return;
  }
  currentStroke.get("path").push([[event.x, event.y, event.pressure]]);
});

// @ts-ignore

window.Y = Y;
// @ts-ignore
window.svg = svg;
// @ts-ignore
window.ystrokes = ystrokes;
// @ts-ignore
window.ydoc = ydoc;

/**
 * @type {Y.Array<Y.Map<>>}
 * ymap.set('pos', {x, y})
 *
 * ymap.set('posy', y)
 *
 */
