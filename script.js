const scene = document.querySelector(".workflow-scene");

const positionConnectors = () => {
  if (!scene) {
    return;
  }

  const svg = scene.querySelector(".flow-lines");
  const input = scene.querySelector(".node-input");
  const systems = scene.querySelector(".node-systems");
  const agent = scene.querySelector(".agent-node");
  const output = scene.querySelector(".node-output");
  const inputAgentPath = scene.querySelector(".path-input-agent");
  const systemsAgentPath = scene.querySelector(".path-systems-agent");
  const agentOutputPath = scene.querySelector(".path-agent-output");

  if (!svg || !input || !systems || !agent || !output || !inputAgentPath || !systemsAgentPath || !agentOutputPath) {
    return;
  }

  const sceneRect = scene.getBoundingClientRect();
  const viewBoxParts = svg.getAttribute("viewBox").split(/\s+/).map(Number);
  const viewBox = {
    width: viewBoxParts[2],
    height: viewBoxParts[3],
  };
  const xScale = viewBox.width / sceneRect.width;
  const yScale = viewBox.height / sceneRect.height;

  const point = (element, side) => {
    const rect = element.getBoundingClientRect();
    const local = {
      left: rect.left - sceneRect.left,
      right: rect.right - sceneRect.left,
      top: rect.top - sceneRect.top,
      bottom: rect.bottom - sceneRect.top,
      centerX: rect.left - sceneRect.left + rect.width / 2,
      centerY: rect.top - sceneRect.top + rect.height / 2,
    };

    const points = {
      right: [local.right, local.centerY],
      left: [local.left, local.centerY],
      top: [local.centerX, local.top],
      bottom: [local.centerX, local.bottom],
    };

    const [x, y] = points[side];
    return {
      x: x * xScale,
      y: y * yScale,
    };
  };

  const horizontalConnector = (start, end, bend = 0) => {
    const tension = Math.max(18, Math.abs(end.x - start.x) * 0.48);
    return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${(start.x + tension).toFixed(1)} ${(start.y + bend).toFixed(1)} ${(end.x - tension).toFixed(1)} ${(end.y - bend).toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  };

  const verticalConnector = (start, end) => {
    const lift = Math.max(14, Math.abs(end.y - start.y) * 0.55);
    return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${start.x.toFixed(1)} ${(start.y + lift).toFixed(1)} ${end.x.toFixed(1)} ${(end.y - lift).toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  };

  inputAgentPath.setAttribute("d", horizontalConnector(point(input, "right"), point(agent, "left"), -5));
  systemsAgentPath.setAttribute("d", verticalConnector(point(systems, "bottom"), point(agent, "top")));
  agentOutputPath.setAttribute("d", horizontalConnector(point(agent, "right"), point(output, "left"), 5));
};

const bootFlow = () => {
  positionConnectors();
  document.body.classList.remove("vectorpoint-loaded");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      positionConnectors();
      document.body.classList.add("vectorpoint-loaded");
      window.setTimeout(positionConnectors, 1800);
    });
  });
};

window.addEventListener("load", () => {
  window.setTimeout(bootFlow, 260);
});

if (scene) {
  scene.addEventListener("pointermove", (event) => {
    const rect = scene.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3);
    const y = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3);
    scene.style.setProperty("--tilt-x", x);
    scene.style.setProperty("--tilt-y", y);
  });

  window.addEventListener("resize", positionConnectors);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(positionConnectors);
    observer.observe(scene);
  }
}
