import React, { useRef, useEffect, useState } from 'react';
import {
  select,
  scaleLinear,
  line,
  min,
  max,
  curveCardinal,
  axisBottom,
  axisLeft,
  timeFormat,
  tickFormat,
  zoom,
  zoomTransform,
} from 'd3';
import useResizeObserver from '../useResizeObserver';

/**
 * Component that renders a LineChart
 */

function LineChart(props) {
  const avgLatency = props.mutationData.map(elt => ({avgL: elt.avgLatency, mutationDate: parseInt(elt.dateTime)})); 
  const mutationLatencies = props.mutationData.map(elt => elt.avgLatency);
  const mutationDates = props.mutationData.map(elt => parseInt(elt.dateTime));
  const subscribers = props.mutationData.map(elt => elt.expectedAqls);
  console.log(avgLatency);
  console.log(min(mutationDates));
  console.log(max(mutationDates));

  const svgRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const [currentZoomState, setCurrentZoomState] = useState();

  // will be called initially and on every data change
  useEffect(() => {
    const svg = select(svgRef.current);
    const svgContent = svg.select('.content');
    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    // scales + line generator
    const xScale = scaleLinear()
      .domain([min(mutationDates), max(mutationDates)])
      .range([0, width]);

    if (currentZoomState) {
      const newXScale = currentZoomState.rescaleX(xScale);
      xScale.domain(newXScale.domain());
    }

    const yScale = scaleLinear()
      .domain([0, max(mutationLatencies) + 10])
      .range([height, 0]);

    const lineGenerator = line()
      .x((d) => xScale(d.mutationDate))
      .y((d) => yScale(d.avgL))
      .curve(curveCardinal);

    // render the line
    svgContent
      .selectAll('.myLine')
      .data([avgLatency])
      .join('path')
      .attr('class', 'myLine')
      .attr('stroke', 'lightblue')
      .attr('fill', 'none')
      .attr('d', lineGenerator);

    svgContent
      .selectAll('.myDot')
      .data(avgLatency)
      .join('circle')
      .attr('class', 'myDot')
      .attr('stroke', 'lightblue')
      .attr('r', 2)
      .attr('fill', 'lightblue')
      .attr('cx', (d) => xScale(d.mutationDate))
      .attr('cy', (d) => yScale(d.avgL));

    // axes
    const xAxis = axisBottom(xScale)
      .tickFormat(timeFormat('%Y-%m-%dT%H:%M:%S.%LZ'));

    svg
      .select('.x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .style('color', 'white')
      .selectAll('text')
        .attr("transform", "translate(-10,10)rotate(-45)")
        .style("text-anchor", "end")
        // .style("font-size", 20)


    const yAxis = axisLeft(yScale);
    svg.select('.y-axis').style('color', 'white').call(yAxis);

    // zoom
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 5])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', () => {
        const zoomState = zoomTransform(svg.node());
        setCurrentZoomState(zoomState);
      });

    svg.call(zoomBehavior);
  }, [currentZoomState, avgLatency, dimensions]);

  return (
    <React.Fragment>
      <div ref={wrapperRef} style={{ marginBottom: '2rem' }}>
        <svg className="LineChart" ref={svgRef}>
          <defs>
            <clipPath id="LineChart">
              <rect x="0" y="0" width="100%" height="100%" />
            </clipPath>
          </defs>
          <g className="content" clipPath={`url(#LineChart)`}></g>
          <g className="x-axis" />
          <g className="y-axis" />
        </svg>
      </div>
    </React.Fragment>
  );
}

export default LineChart;