import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Sparkles, Filter, Award, Target, Calendar } from 'lucide-react';

export interface SubjectGradeRecord {
  subject: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  previousTermTotal?: number;
  grade: string;
}

interface StudentGradeTrendD3ChartProps {
  studentName?: string;
  className?: string;
  academicSession?: string;
  data?: SubjectGradeRecord[];
}

const DEFAULT_GRADE_DATA: SubjectGradeRecord[] = [
  { subject: 'Mathematics', ca1: 18, ca2: 17, exam: 54, total: 89, previousTermTotal: 78, grade: 'A1' },
  { subject: 'English Lang', ca1: 16, ca2: 18, exam: 51, total: 85, previousTermTotal: 82, grade: 'A1' },
  { subject: 'Physics', ca1: 15, ca2: 16, exam: 48, total: 79, previousTermTotal: 71, grade: 'B2' },
  { subject: 'Chemistry', ca1: 17, ca2: 15, exam: 46, total: 78, previousTermTotal: 74, grade: 'B2' },
  { subject: 'Biology', ca1: 19, ca2: 18, exam: 55, total: 92, previousTermTotal: 86, grade: 'A1' },
  { subject: 'Economics', ca1: 14, ca2: 15, exam: 45, total: 74, previousTermTotal: 68, grade: 'B3' },
  { subject: 'Computer Sci', ca1: 20, ca2: 19, exam: 58, total: 97, previousTermTotal: 90, grade: 'A1' },
  { subject: 'Civic Edu', ca1: 18, ca2: 17, exam: 50, total: 85, previousTermTotal: 80, grade: 'A1' },
  { subject: 'Further Math', ca1: 14, ca2: 13, exam: 44, total: 71, previousTermTotal: 65, grade: 'B3' }
];

export const StudentGradeTrendD3Chart: React.FC<StudentGradeTrendD3ChartProps> = ({
  studentName = 'Student',
  className = 'SS 2 Gold',
  academicSession = '2025/2026 Academic Session',
  data = DEFAULT_GRADE_DATA
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [activeView, setActiveView] = useState<'total' | 'breakdown' | 'trend'>('total');
  const [selectedTerm, setSelectedTerm] = useState<'1st Term' | '2nd Term' | '3rd Term' | 'Annual Average'>('2nd Term');
  const [hoveredData, setHoveredData] = useState<SubjectGradeRecord | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 650;
    const height = 360;
    const margin = { top: 30, right: 30, bottom: 65, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto; font-family: inherit;');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    const yGridScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);
    const yGrid = d3.axisLeft(yGridScale).ticks(5).tickSize(-innerWidth).tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    g.select('.grid path').remove();

    // Benchmarks
    const benchmarks = [
      { y: 85, label: 'Excellence (85%)', color: '#10b981' },
      { y: 70, label: 'Credit (70%)', color: '#6366f1' },
      { y: 50, label: 'Pass (50%)', color: '#f59e0b' }
    ];

    benchmarks.forEach((b) => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yGridScale(b.y))
        .attr('y2', yGridScale(b.y))
        .attr('stroke', b.color)
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);
    });

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.subject))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear().domain([0, 100]).nice().range([innerHeight, 0]);

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', '#475569');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}%`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#64748b');

    // Gradient definitions
    const defs = svg.append('defs');

    // Emerald gradient
    const gradEmerald = defs.append('linearGradient').attr('id', 'grad-emerald').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    gradEmerald.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    gradEmerald.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Indigo gradient
    const gradIndigo = defs.append('linearGradient').attr('id', 'grad-indigo').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    gradIndigo.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1');
    gradIndigo.append('stop').attr('offset', '100%').attr('stop-color', '#4f46e5');

    // Amber gradient
    const gradAmber = defs.append('linearGradient').attr('id', 'grad-amber').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    gradAmber.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
    gradAmber.append('stop').attr('offset', '100%').attr('stop-color', '#d97706');

    // Color mapper based on score
    const getBarFill = (val: number) => {
      if (val >= 85) return 'url(#grad-emerald)';
      if (val >= 70) return 'url(#grad-indigo)';
      return 'url(#grad-amber)';
    };

    if (activeView === 'total') {
      // Draw Single Total Score Bars
      const bars = g
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => xScale(d.subject) || 0)
        .attr('width', xScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('rx', 6)
        .attr('fill', (d) => getBarFill(d.total))
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          setHoveredData(d);
          d3.select(event.currentTarget).attr('opacity', 0.85);
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).attr('opacity', 1);
        });

      bars
        .transition()
        .duration(800)
        .delay((_, i) => i * 45)
        .attr('y', (d) => yScale(d.total))
        .attr('height', (d) => innerHeight - yScale(d.total));

      // Value labels above bars
      g.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', (d) => (xScale(d.subject) || 0) + xScale.bandwidth() / 2)
        .attr('y', (d) => yScale(d.total) - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', '#334155')
        .style('opacity', 0)
        .text((d) => `${d.total}%`)
        .transition()
        .duration(800)
        .delay((_, i) => i * 45 + 300)
        .style('opacity', 1);

    } else if (activeView === 'breakdown') {
      // Grouped bar chart: CA1 (max 20), CA2 (max 20), Exam (max 60)
      const subCategories = ['ca1', 'ca2', 'exam'];
      const xSubScale = d3
        .scaleBand()
        .domain(subCategories)
        .range([0, xScale.bandwidth()])
        .padding(0.15);

      const colorMap: Record<string, string> = {
        ca1: '#38bdf8',
        ca2: '#818cf8',
        exam: '#34d399'
      };

      const subjectGroups = g
        .selectAll('.subject-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'subject-group')
        .attr('transform', (d) => `translate(${xScale(d.subject)}, 0)`);

      subCategories.forEach((cat) => {
        subjectGroups
          .append('rect')
          .attr('x', (d) => xSubScale(cat) || 0)
          .attr('width', xSubScale.bandwidth())
          .attr('y', innerHeight)
          .attr('height', 0)
          .attr('rx', 3)
          .attr('fill', colorMap[cat])
          .attr('cursor', 'pointer')
          .on('mouseenter', (event, d) => {
            setHoveredData(d);
          })
          .transition()
          .duration(800)
          .attr('y', (d) => {
            const raw = (d as any)[cat];
            // Normalize scale for visualization (exam max 60 scaled to 100%)
            const maxVal = cat === 'exam' ? 60 : 20;
            const pct = (raw / maxVal) * 100;
            return yScale(pct);
          })
          .attr('height', (d) => {
            const raw = (d as any)[cat];
            const maxVal = cat === 'exam' ? 60 : 20;
            const pct = (raw / maxVal) * 100;
            return innerHeight - yScale(pct);
          });
      });

    } else if (activeView === 'trend') {
      // Comparison: Current vs Previous Term
      const subTerms = ['previousTermTotal', 'total'];
      const xSubScale = d3
        .scaleBand()
        .domain(subTerms)
        .range([0, xScale.bandwidth()])
        .padding(0.15);

      const termGroups = g
        .selectAll('.term-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'term-group')
        .attr('transform', (d) => `translate(${xScale(d.subject)}, 0)`);

      termGroups
        .append('rect')
        .attr('x', () => xSubScale('previousTermTotal') || 0)
        .attr('width', xSubScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', '#94a3b8')
        .attr('opacity', 0.75)
        .transition()
        .duration(800)
        .attr('y', (d) => yScale(d.previousTermTotal || 0))
        .attr('height', (d) => innerHeight - yScale(d.previousTermTotal || 0));

      termGroups
        .append('rect')
        .attr('x', () => xSubScale('total') || 0)
        .attr('width', xSubScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', 'url(#grad-emerald)')
        .on('mouseenter', (event, d) => setHoveredData(d))
        .transition()
        .duration(800)
        .delay(150)
        .attr('y', (d) => yScale(d.total))
        .attr('height', (d) => innerHeight - yScale(d.total));
    }
  }, [data, activeView, selectedTerm]);

  // Average calculation
  const classAverage = Math.round(data.reduce((acc, curr) => acc + curr.total, 0) / (data.length || 1));
  const distinctionCount = data.filter((d) => d.total >= 75).length;

  return (
    <div id="student-d3-grade-chart-container" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                D3 Academic Grade Trends & Benchmarks
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                  {academicSession}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizing cumulative performance for {studentName} ({className})
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            id="btn-view-total"
            onClick={() => setActiveView('total')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'total'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Subject Totals
          </button>
          <button
            id="btn-view-breakdown"
            onClick={() => setActiveView('breakdown')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'breakdown'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            CA & Exam Split
          </button>
          <button
            id="btn-view-trend"
            onClick={() => setActiveView('trend')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeView === 'trend'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Term vs Term
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:shadow-md transition-shadow cursor-default"
        >
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Terminal Average</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1.5">
            {classAverage}%
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+4.2%</span>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:shadow-md transition-shadow cursor-default"
        >
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Distinctions (A/B)</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {distinctionCount} / {data.length}
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:shadow-md transition-shadow cursor-default"
        >
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Best Performance</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            97%
            <span className="text-[11px] font-normal text-slate-500 ml-1">Comp Sci</span>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs hover:shadow-md transition-shadow cursor-default"
        >
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Selected Term</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            {selectedTerm}
          </div>
        </motion.div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="w-full relative overflow-x-auto">
        <svg ref={svgRef} className="w-full" />
      </div>

      {/* Legend & Hover Details */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>Excellence (85%+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-indigo-500" />
            <span>Credit / Good (70-84%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-xs bg-amber-500" />
            <span>Pass (50-69%)</span>
          </div>
          {activeView === 'trend' && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-slate-400" />
              <span>Previous Term</span>
            </div>
          )}
        </div>

        {hoveredData && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-lg text-emerald-800 dark:text-emerald-300 font-medium">
            🎯 {hoveredData.subject}: <span className="font-bold">{hoveredData.total}%</span> ({hoveredData.grade}) | CA1: {hoveredData.ca1} • CA2: {hoveredData.ca2} • Exam: {hoveredData.exam}
          </div>
        )}
      </div>
    </div>
  );
};
