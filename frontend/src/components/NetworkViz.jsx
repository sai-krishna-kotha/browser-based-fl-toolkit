import ForceGraph2D from "react-force-graph";

export default function NetworkViz() {
  const data = {
    nodes: [
      { id: "Server", color: "#a855f7" },
      { id: "Client1", color: "#22d3ee" },
      { id: "Client2", color: "#34d399" },
      { id: "Client3", color: "#f97316" },
    ],
    links: [
      { source: "Client1", target: "Server" },
      { source: "Client2", target: "Server" },
      { source: "Client3", target: "Server" },
    ],
  };

  return (
    <ForceGraph2D
      graphData={data}
      backgroundColor="transparent"
      nodeRelSize={6}
      linkColor={() => "#a78bfa"}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const label = node.id;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }}
    />
  );
}
