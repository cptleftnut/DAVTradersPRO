import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const DonutChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 200;
    const height = 200;
    const margin = 10;

    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const group = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.label))
      .range(['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']);

    const pie = d3.pie<{ label: string; value: number }>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcs = group.selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs.append("path")
      .attr("d", arc as any)
      .attr("fill", d => color(d.data.label))
      .attr("stroke", "var(--color-gray-900)")
      .style("stroke-width", "2px");

    // Add tooltips
    const tooltip = d3.select("body").append("div")
      .attr("class", "absolute hidden bg-gray-900 border border-gray-700 text-white text-xs px-2 py-1 rounded pointer-events-none")
      .style("opacity", 0)
      .style("z-index", "9999");

    arcs.on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 1).style("display", "block");
        tooltip.html(`${d.data.label}: $${d.data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
        d3.select(this).select("path").style("opacity", 0.8);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0).on("end", () => tooltip.style("display", "none"));
        d3.select(this).select("path").style("opacity", 1);
      });

    return () => {
      d3.select("body").selectAll(".absolute.hidden").remove();
    };
  }, [data]);

  return <svg ref={svgRef}></svg>;
};
